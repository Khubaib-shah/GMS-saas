import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import InventoryLog from "@/models/InventoryLog";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();
        
        const { id } = await params;
        const order = await Order.findOne({ _id: id, gymId: session.user.gymId });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.status === "completed") {
            return NextResponse.json({ error: "Order is already completed" }, { status: 400 });
        }

        // Reduce stock and log inventory for each item
        for (const item of order.items) {
            const product = await Product.findOne({ _id: item.productId, gymId: session.user.gymId });
            
            if (product && product.trackInventory) {
                const previousQuantity = product.stockQuantity;
                product.stockQuantity -= item.quantity;
                await product.save();

                const log = new InventoryLog({
                    gymId: session.user.gymId,
                    productId: product._id,
                    type: "sale",
                    quantityChange: -item.quantity,
                    previousQuantity,
                    newQuantity: product.stockQuantity,
                    reason: "Pending Order Completed by Admin",
                    referenceId: order.receiptNumber,
                    performedBy: session.user.id
                });
                await log.save();
            }
        }

        order.status = "completed";
        order.processedBy = session.user.id;
        await order.save();

        return NextResponse.json({ success: true, order });

    } catch (error: any) {
        console.error("Complete order error:", error);
        return NextResponse.json({ error: "Failed to complete order" }, { status: 500 });
    }
}
