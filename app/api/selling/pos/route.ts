import { NextResponse } from "next/server";
import { requirePermission, checkFeature } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import InventoryLog from "@/models/InventoryLog";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

export async function POST(req: Request) {
    const featureResult = await checkFeature("selling");
    if ("error" in featureResult) return featureResult.error;

    // We assume PRODUCTS_CREATE or a new POS specific permission is required. Using PRODUCTS_CREATE for now.
    const authResult = await requirePermission(PERMISSIONS.PRODUCTS_CREATE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const body = await req.json();
        const { items, memberId, paymentMethod, totalAmount, discountAmount = 0 } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        await connectDB();
        
        const gymId = session.user.gymId;
        const staffId = session.user.id;

        // 1. Verify Stock
        const orderItems = [];
        let calculatedTotal = 0;

        for (const item of items) {
            const product = await Product.findOne({ _id: item.productId, gymId });
            if (!product) {
                return NextResponse.json({ error: `Product not found: ${item.name}` }, { status: 404 });
            }

            if (product.trackInventory && product.stockQuantity < item.quantity) {
                return NextResponse.json({ error: `Insufficient stock for ${product.name}. Only ${product.stockQuantity} left.` }, { status: 400 });
            }

            const unitPrice = item.price || product.discountPrice || product.price;
            const subtotal = unitPrice * item.quantity;
            calculatedTotal += subtotal;

            orderItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                unitPrice,
                subtotal
            });
        }

        const finalAmount = calculatedTotal - discountAmount;

        // 2. Create Order
        const order = new Order({
            gymId,
            memberId: memberId || undefined,
            processedBy: staffId,
            items: orderItems,
            totalAmount: calculatedTotal,
            discountAmount,
            finalAmount,
            paymentMethod,
            status: "completed",
            source: "pos"
        });

        await order.save();

        // 3. Deduct Stock & Create Inventory Logs
        for (const item of items) {
            const product = await Product.findOne({ _id: item.productId, gymId });
            if (product && product.trackInventory) {
                const previousQuantity = product.stockQuantity;
                product.stockQuantity -= item.quantity;
                await product.save();

                const log = new InventoryLog({
                    gymId,
                    productId: product._id,
                    type: "sale",
                    quantityChange: -item.quantity,
                    previousQuantity,
                    newQuantity: product.stockQuantity,
                    reason: "POS Sale",
                    referenceId: order.receiptNumber,
                    performedBy: staffId
                });
                await log.save();
            }
        }

        // 4. Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "order",
                order._id.toString(),
                `POS Sale - ${order.receiptNumber}`,
                { amount: finalAmount, items: items.length },
                req.headers
            )
        );

        return NextResponse.json({ success: true, order }, { status: 201 });
    } catch (error: any) {
        console.error("POS Sale Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process sale" }, { status: 500 });
    }
}
