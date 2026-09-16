const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedAdminAccount = async () => {
  try {
    const adminEmail = 'admin@ecommerce.com';
    let admin = await Admin.findOne({ email: adminEmail.toLowerCase() });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    if (admin) {
      // Ensure password is correctly set to bcrypt hash of admin123
      const isMatch = await bcrypt.compare('admin123', admin.password);
      if (!isMatch) {
        admin.password = hashedPassword;
        await admin.save();
        console.log(`[Admin Seed] Updated password hash for existing admin: ${adminEmail}`);
      } else {
        console.log(`[Admin Seed] Admin account already active & verified: ${adminEmail}`);
      }
      return admin;
    }

    // Create new admin document
    admin = await Admin.create({
      name: 'System Admin',
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    });

    console.log(`[Admin Seed] Successfully created default admin: ${admin.email} (Password hashed with bcrypt)`);
    return admin;
  } catch (error) {
    console.error(`[Admin Seed Error] Failed to seed admin account:`, error.message);
    throw error;
  }
};

// Allow direct execution from command line: node seedAdmin.js
if (require.main === module) {
  (async () => {
    await connectDB();
    await seedAdminAccount();
    mongoose.connection.close();
  })();
}

module.exports = seedAdminAccount;
