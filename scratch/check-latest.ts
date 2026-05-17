import "../scripts/env-loader";
import connectDB from "../lib/db";
import Member from "../models/Member";
import Gym from "../models/Gym";
import SubscriptionPlan from "../models/SubscriptionPlan";

async function checkLatest() {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Database connected successfully!");

    console.log("Fetching latest member...");
    // Bypass TS compile errors for mongoose by casting as any
    const latestMember = await (Member as any).findOne({}).sort({ createdAt: -1 }).lean();

    if (!latestMember) {
      console.log("No members found in the database!");
      process.exit(0);
    }

    console.log("\n================ LATEST MEMBER DETAILS ================");
    console.log("ID:", latestMember._id ? latestMember._id.toString() : "N/A");
    console.log("First Name:", latestMember.firstName);
    console.log("Last Name:", latestMember.lastName);
    console.log("Email:", latestMember.email);
    console.log("Gym ID:", latestMember.gymId ? latestMember.gymId.toString() : "N/A");
    console.log("Plan ID:", latestMember.planId);
    console.log("Created At:", latestMember.createdAt);
    console.log("=======================================================\n");

    if (latestMember.gymId) {
      console.log("Fetching gym details...");
      const gym = await (Gym as any).findById(latestMember.gymId).lean();
      console.log("Gym details:", gym ? JSON.stringify(gym, null, 2) : "Gym NOT found!");
    }

    if (latestMember.planId) {
      console.log("Fetching plan details...");
      const plan = await (SubscriptionPlan as any).findById(latestMember.planId).lean();
      console.log("Plan details:", plan ? JSON.stringify(plan, null, 2) : "Plan NOT found!");
    }

  } catch (error) {
    console.error("Error in checkLatest:", error);
  } finally {
    process.exit(0);
  }
}

checkLatest();
