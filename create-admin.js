const BASE_URL = "http://localhost:3000";

async function createAdmin() {
  console.log("Creating admin user...");
  try {
    const res = await fetch(`${BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
          fullName: "Admin User", 
          email: "admin@gym.com", 
          password: "password123" 
      }),
    });
    
    if (res.ok) {
        console.log("✅ Admin user created successfully");
        console.log("Email: admin@gym.com");
        console.log("Password: password123");
    } else {
        const data = await res.json();
        console.log("⚠️ Creation failed:", data.message);
        if (data.message === "User already exists") {
            console.log("This means you can likely login with admin@gym.com / password123 (or whatever it was set to)");
        }
    }
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
}

createAdmin();
