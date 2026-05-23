import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";

const MEMBER_JWT_SECRET = process.env.NEXTAUTH_SECRET || "member-portal-secret";

interface MemberToken {
    memberId: string;
    gymId: string;
    email: string;
    type: "member";
}

function verifyMemberToken(authHeader: string | null): MemberToken | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, MEMBER_JWT_SECRET) as MemberToken;
        if (decoded.type !== "member") return null;
        return decoded;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    const tokenData = verifyMemberToken(req.headers.get("authorization"));

    if (!tokenData) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { items = [], paymentMethod, paymentReceiptUrl } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        await connectDB();
        
        let totalAmount = 0;
        const orderItems = [];
        let itemsListStr = ""; // For email

        for (const item of items) {
            const product = await Product.findOne({ _id: item.productId, gymId: tokenData.gymId });
            if (!product || product.status !== "active") {
                return NextResponse.json({ error: `Product ${item.productId} not available` }, { status: 400 });
            }

            // We do not strictly fail on stock quantity if we are taking pending orders.
            const unitPrice = product.discountPrice || product.price;
            const subtotal = unitPrice * item.quantity;
            totalAmount += subtotal;

            orderItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                unitPrice,
                subtotal
            });

            itemsListStr += `<p style="margin: 0 0 10px 0;"><strong>${product.name}</strong> x ${item.quantity} = PKR ${subtotal.toLocaleString()}</p>`;
        }

        // Create Order (Payment method from frontend: cash or online)
        const order = new Order({
            gymId: tokenData.gymId,
            memberId: tokenData.memberId,
            items: orderItems,
            totalAmount,
            discountAmount: 0,
            finalAmount: totalAmount,
            paymentMethod: paymentMethod === "online" ? "online" : "cash", 
            paymentReceiptUrl: paymentReceiptUrl || null,
            status: "pending", 
            source: "member_portal",
            notes: paymentMethod === "online" ? "Online Payment (Pending Verification)" : "Cash Payment (Pending at Reception)"
        });

        await order.save();

        // NO STOCK REDUCTION HERE! Stock is reduced when admin verifies it.

        // --- NOTIFICATIONS ---
        
        // 1. In-App Notification
        const { default: Notification } = await import("@/models/Notification");
        await Notification.create({
            gymId: tokenData.gymId,
            targetRoles: ["admin", "staff", "owner", "super_admin"],
            title: "New Pending Order",
            message: `${tokenData.email} placed an order for ${orderItems.length} item(s). Payment: ${paymentMethod}.`,
            type: "order_placed",
            link: "/selling/pos" // They can view it in the selling orders tab
        });

        // 2. Email Notification to Staff/Admins
        try {
            const { default: User } = await import("@/models/User");
            const { sendEmail, getBaseTemplate } = await import("@/lib/mail-service");
            
            // Find all admins and staff for this gym
            const admins = await User.find({ 
                gymId: tokenData.gymId, 
                role: { $in: ["admin", "staff", "owner"] } 
            }).select("email").lean();
            
            const emails = admins.map(admin => admin.email).filter(Boolean);
            
            if (emails.length > 0) {
                const html = getBaseTemplate(
                    "New Pending Order",
                    `<p>A member (<strong>${tokenData.email}</strong>) has just placed a new order via the Member Portal.</p>
                     <p><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
                     <div class="receipt-box" style="background: #11161d; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0;">
                       ${itemsListStr}
                       <hr style="border-color: #1e293b; margin: 10px 0;">
                       <p style="margin: 0;"><strong>Total Amount:</strong> PKR ${totalAmount.toLocaleString()}</p>
                     </div>
                     <p>This order is currently <strong>PENDING</strong>. Please review it on the dashboard and mark as completed to deduct inventory.</p>
                     <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/selling/pos" class="btn">View Orders</a>`
                );

                // Send to all staff
                await sendEmail({
                    to: emails.join(", "),
                    subject: "New Member Store Order (Pending)",
                    html,
                    gymId: tokenData.gymId
                });
            }
        } catch (emailError) {
            console.error("Failed to send order email notification:", emailError);
            // Don't fail the checkout if email fails
        }

        return NextResponse.json({ success: true, order });
    } catch (error: any) {
        console.error("Purchase error:", error);
        return NextResponse.json({ error: "Purchase failed", details: error.message }, { status: 500 });
    }
}
