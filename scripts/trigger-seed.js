async function triggerSeed() {
    console.log("Triggering comprehensive seed via API...");
    try {
        const res = await fetch("http://localhost:3000/api/seed/comprehensive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret: "comprehensive-seed-2026" })
        });
        
        const data = await res.json();
        if (res.ok) {
            console.log("✅ Seeding complete!");
            console.log("Data:", JSON.stringify(data, null, 2));
        } else {
            console.log("❌ Seeding failed:", data.message);
            if (data.error) console.log("Error:", data.error);
        }
    } catch (e) {
        console.error("❌ Request error:", e.message);
    }
}

triggerSeed();
