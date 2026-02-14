/**
 * Seed Script - Create Superadmin User
 * Run this script to create a superadmin user in the database
 * 
 * Usage: node scripts/seed-superadmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Manually load .env variables without dotenv dependency
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`ℹ️  Loading environment from ${file}`);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        // Skip comments and empty lines
        if (!line || line.startsWith('#') || !line.includes('=')) continue;
        
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes
        
        if (key && value && !process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    }
  }
}

// Load env variables
loadEnv();

// MongoDB Connection String - using MONGODB_URL to match your app's config
const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    console.error('❌ MONGODB_URL not found in environment variables');
    console.log('ℹ️  Make sure .env.local or .env file exists with MONGODB_URL');
    process.exit(1);
}

// Superadmin credentials
const SUPERADMIN_DATA = {
  fullName: 'Super Admin',
  email: 'admin@gmsaas.com',
  password: 'admin123', // Change this to a secure password!
  role: 'super_admin',
  isActive: true,
};

// User Schema (simplified for seeding)
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'owner' },
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym' },
  branchId: { type: mongoose.Schema.Types.ObjectId },
  customPermissions: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  lastFailedLoginAt: Date,
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedSuperadmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    // Use MONGODB_URL from env
    await mongoose.connect(MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ email: SUPERADMIN_DATA.email });
    
    if (existingAdmin) {
      console.log('⚠️  Superadmin already exists with email:', SUPERADMIN_DATA.email);
      console.log('ℹ️  User ID:', existingAdmin._id);
      console.log('ℹ️  Role:', existingAdmin.role);
      
      // Update password if it exists but we want to reset it
      console.log('� Resetting password check...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(SUPERADMIN_DATA.password, 10);
      
      await User.findByIdAndUpdate(existingAdmin._id, { 
        password: hashedPassword,
        role: 'super_admin', // Ensure role is correct
        isActive: true
      });
      
      console.log('✅ Superadmin updated successfully!');
    } else {
      // Hash the password
      console.log('🔒 Hashing password...');
      const hashedPassword = await bcrypt.hash(SUPERADMIN_DATA.password, 10);

      // Create superadmin user
      console.log('👤 Creating superadmin user...');
      const superadmin = await User.create({
        ...SUPERADMIN_DATA,
        password: hashedPassword,
      });

      console.log('\n✅ Superadmin created successfully!');
      console.log('─────────────────────────────────────');
      console.log('📧 Email:', superadmin.email);
      console.log('🆔 User ID:', superadmin._id);
    }
    
    console.log('� Password:', SUPERADMIN_DATA.password);
    console.log('─────────────────────────────────────');
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    console.log('🌐 You can now login at: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error seeding superadmin:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedSuperadmin();
