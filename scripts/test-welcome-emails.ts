import "./env-loader"; // MUST be first to populate process.env before other imports execute!
import { sendEmail } from "../lib/mail-service";
import { EmailTemplates } from "../lib/email-templates";

async function runTest() {
    const targetEmail = process.argv[2] || process.env.SMTP_USER;

    if (!targetEmail) {
        console.error("\n Error: Please specify a target email address to receive the test emails.");
        console.error("Usage: npx ts-node scripts/test-welcome-emails.ts your-email@example.com\n");
        process.exit(1);
    }

    console.log("\n=======================================================");
    console.log("GYMFLOW SaaS — WELCOME EMAILS TEST HARNESS");
    console.log("=======================================================");
    console.log(`SMTP Target: ${targetEmail}`);
    console.log(`SMTP Host:   ${process.env.SMTP_HOST || "not set"}`);
    console.log(`SMTP User:   ${process.env.SMTP_USER || "not set"}`);
    console.log("=======================================================\n");

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn(" Warning: SMTP environment variables are not fully configured in your .env file.");
        console.warn(" The mail service will execute in Development Mock mode and print preview logs only.");
        console.warn(" To receive real emails, verify your SMTP credentials are set.\n");
    }

    // ───────────────────────────────────────────────────
    // TEST 1: Gym Owner Welcome Email (SaaS Onboarding)
    // ───────────────────────────────────────────────────
    console.log("[Test 1] Preparing Gym Owner SaaS Welcome Email...");
    const ownerHtml = EmailTemplates.ownerWelcome({
        ownerName: "Champion Gym Owner",
        gymName: "Alpha Fitness Arena",
        planName: "Enterprise Professional",
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        loginUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`
    });

    console.log("[Test 1] Sending Owner Welcome Email...");
    const ownerResult = await sendEmail({
        to: targetEmail,
        subject: "Welcome to GymFlow — Your subscription is active!",
        html: ownerHtml
    });

    if (ownerResult.success) {
        console.log(`[Test 1] Success! Message ID: ${ownerResult.messageId}\n`);
    } else {
        console.error(`[Test 1] Failed:`, ownerResult.error, "\n");
    }

    // ───────────────────────────────────────────────────
    // TEST 2: Gym Member Welcome Email (Portal Onboarding)
    // ───────────────────────────────────────────────────
    console.log("[Test 2] Preparing Gym Member Welcome Email...");
    const memberHtml = EmailTemplates.memberWelcome({
        memberName: "Alex Fitguy",
        gymName: "Alpha Fitness Arena",
        planName: "Yearly Elite Strength Pass",
        email: targetEmail,
        portalUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/member-portal/login`
    });

    console.log("[Test 2] Sending Member Welcome Email...");
    const memberResult = await sendEmail({
        to: targetEmail,
        subject: "Welcome to Alpha Fitness Arena!",
        html: memberHtml
        // Note: passing no gymId targets system fallback SMTP for the test
    });

    if (memberResult.success) {
        console.log(`[Test 2] Success! Message ID: ${memberResult.messageId}\n`);
    } else {
        console.error(`[Test 2] Failed:`, memberResult.error, "\n");
    }

    console.log("=======================================================");
    console.log("Test harness run complete.");
    console.log("If real SMTP credentials were set, check your inbox!");
    console.log("=======================================================\n");
}

runTest();
