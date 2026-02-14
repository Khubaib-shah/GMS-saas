const BASE_URL = "http://localhost:3000";

async function verifyRoot() {
  console.log("Checking if root path / is protected...");
  try {
    const res = await fetch(`${BASE_URL}/`, {
      redirect: 'manual' 
    });
    
    console.log(`Status: ${res.status}`);
    
    if (res.status === 307 || res.status === 302 || res.type === 'opaqueredirect') {
        const loc = res.headers.get("location");
        console.log(`❌ Root is REDIRECTED to: ${loc}`);
    } else if (res.status === 200) {
        console.log("✅ Root is ACCESSIBLE (200 OK)");
    } else {
        console.log(`⚠️ Root returned unexpected status: ${res.status}`);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

verifyRoot();
