const BASE_URL = "http://localhost:3000";

async function verifyMiddleware() {
  console.log("Checking middleware protection...");
  try {
    // try to access dashboard without cookies
    const res = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual' 
    });
    
    console.log(`Status: ${res.status}`);
    
    if (res.status === 307 || res.status === 302 || res.type === 'opaqueredirect') {
        console.log("✅ Redirected (Protected)");
        const loc = res.headers.get("location");
        console.log(`Location: ${loc}`);
    } else if (res.status === 200) {
        console.log("❌ Accessed successfully (NOT Protected!)");
    } else {
        console.log(`⚠️ Unexpected status: ${res.status}`);
    }

    // try to access login
    const loginRes = await fetch(`${BASE_URL}/login`);
    if (loginRes.status === 200) {
        console.log("✅ Login page accessible");
    } else {
        console.log(`❌ Login page issue: ${loginRes.status}`);
    }

  } catch (e) {
    console.error("Error:", e.message);
  }
}

verifyMiddleware();
