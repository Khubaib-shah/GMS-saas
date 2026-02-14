const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define minimal schemas if models are not loaded
const MemberSchema = new mongoose.Schema({ deletedAt: Date });
const PaymentSchema = new mongoose.Schema({ memberId: mongoose.Schema.Types.ObjectId, deletedAt: Date });
const SubscriptionSchema = new mongoose.Schema({ memberId: mongoose.Schema.Types.ObjectId, deletedAt: Date });

const Member = mongoose.models.Member || mongoose.model('Member', MemberSchema);
const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);

async function cleanup() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Find deleted members
        const deletedMembers = await Member.find({ deletedAt: { $ne: null } });
        const deletedMemberIds = deletedMembers.map(m => m._id);
        console.log(`Found ${deletedMemberIds.length} deleted members.`);

        if (deletedMemberIds.length > 0) {
            // 2. Update Payments
            const payResult = await Payment.updateMany(
                { memberId: { $in: deletedMemberIds }, deletedAt: null },
                { $set: { deletedAt: new Date() } }
            );
            console.log(`Updated ${payResult.modifiedCount} orphaned payments.`);

            // 3. Update Subscriptions
            const subResult = await Subscription.updateMany(
                { memberId: { $in: deletedMemberIds }, deletedAt: null },
                { $set: { deletedAt: new Date() } }
            );
            console.log(`Updated ${subResult.modifiedCount} orphaned subscriptions.`);
        } else {
            console.log("No deleted members found, skipping cleanup.");
        }

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();
