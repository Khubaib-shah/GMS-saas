const mongoose = require('mongoose');
require('dotenv').config();

async function checkIndexes() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collection = db.collection('plans');
  const indexes = await collection.indexes();
  console.log("Indexes on 'plans':", JSON.stringify(indexes, null, 2));
  await mongoose.disconnect();
}

checkIndexes().catch(console.error);
