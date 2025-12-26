const BASE_URL = "http://localhost:3000";

async function verify() {
  console.log("Starting verification...");

  // 1. Register
  const email = `test-${Date.now()}@example.com`;
  const password = "password123";
  console.log(`\n1. Registering user: ${email}`);
  
  try {
    const regRes = await fetch(`${BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Test Admin", email, password }),
    });
    
    if (!regRes.ok) {
        const txt = await regRes.text();
        throw new Error(`Registration failed: ${regRes.status} ${txt}`);
    }
    console.log("✅ Registration successful");

    // 2. Create Member
    console.log("\n2. Creating member...");
    const memberRes = await fetch(`${BASE_URL}/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            firstName: "Verify",
            lastName: "Bot",
            email: `member-${Date.now()}@example.com`,
            joinDate: new Date().toISOString()
        })
    });

    if (!memberRes.ok) {
        const txt = await memberRes.text();
        throw new Error(`Create Member failed: ${memberRes.status} ${txt}`);
    }
    const member = await memberRes.json();
    console.log(`✅ Member created: ${member.id}`);

    // 2b. Plans
    console.log("\n2b. Creating Plan...");
    const planRes = await fetch(`${BASE_URL}/api/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           id: "plan_test",
           name: "Test Plan",
           price: 100,
           duration: 30
        })
    });
    // ignore if already exists for repeat runs
    if (!planRes.ok && planRes.status !== 400) {
        throw new Error("Create Plan failed");
    }
    console.log("✅ Plan check passed");

    // 2c. Subscriptions
    console.log("\n2c. Creating Subscription...");
    const subRes = await fetch(`${BASE_URL}/api/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            memberId: member.id,
            planId: "plan_test",
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            status: "active"
        })
    });
    if (!subRes.ok) throw new Error("Create Subscription failed");
    console.log("✅ Subscription created");

    // 2d. Payments
    console.log("\n2d. Creating Payment...");
    const payRes = await fetch(`${BASE_URL}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            memberId: member.id,
            amount: 100,
            date: new Date().toISOString(),
            method: "cash"
        })
    });
    if (!payRes.ok) throw new Error("Create Payment failed");
    console.log("✅ Payment created");


    // 3. List Members
    console.log("\n3. Listing members...");
    const listRes = await fetch(`${BASE_URL}/api/members`);
    const members = await listRes.json();
    console.log(`✅ Found ${members.length} members`);

    
    const found = members.find(m => m.id === member.id);
    if (!found) throw new Error("Created member not found in list");
    console.log("✅ Created member is in the list");

    // 4. Delete Member
    console.log(`\n4. Deleting member ${member.id}...`);
    const delRes = await fetch(`${BASE_URL}/api/members/${member.id}`, {
        method: "DELETE"
    });
    if (!delRes.ok) throw new Error("Delete failed");
    console.log("✅ Member deleted");

    // 5. Verify Deletion
    const listRes2 = await fetch(`${BASE_URL}/api/members`);
    const members2 = await listRes2.json();
    if (members2.find(m => m.id === member.id)) {
        throw new Error("Member still exists after deletion");
    }
    console.log("✅ Verified deletion");

    console.log("\n🎉 ALL CHECKS PASSED");

  } catch (error) {
    console.error("\n❌ VERIFICATION FAILED:", error);
  }
}

verify();
