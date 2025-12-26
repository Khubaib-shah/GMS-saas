const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Basic manual parsing of .env
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const mongoUriMatch = envContent.match(/MONGODB_URL=(.*)/);
const mongoUri = mongoUriMatch ? mongoUriMatch[1].trim() : null;

if (!mongoUri) {
  console.error("COULD NOT FIND MONGODB_URL in .env");
  process.exit(1);
}

async function fixIndexes() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.");
  const db = mongoose.connection.db;
  const collection = db.collection('plans');
  
  const indexes = await collection.indexes();
  console.log("Current indexes:", indexes.map(i => i.name));
  
  if (indexes.some(i => i.name === 'id_1')) {
    console.log("Dropping global index 'id_1'...");
    try {
      await collection.dropIndex('id_1');
      console.log("Index dropped successfully.");
    } catch (e) {
      console.error("Failed to drop index:", e.message);
    }
  } else {
    console.log("Index 'id_1' not found, no action needed.");
  }
  
  // Also ensure the compound index exists as a fallback
  console.log("Ensuring compound index { id: 1, gymId: 1 } exists...");
  await collection.createIndex({ id: 1, gymId: 1 }, { unique: true });
  console.log("Compound index verified.");
  
  await mongoose.disconnect();
  console.log("Done.");
}

fixIndexes().catch(err => {
  console.error("Error fixing indexes:", err);
  process.exit(1);
});
