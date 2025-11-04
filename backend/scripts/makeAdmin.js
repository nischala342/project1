const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb'

const makeAdmin = async (userEmail) => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.error(`User with email ${userEmail} not found`);
      process.exit(1);
    }

    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      console.error('Admin role not found. Please run: npm run seed:roles');
      process.exit(1);
    }

    user.role = adminRole._id;
    await user.save();

    console.log(`✅ Successfully assigned admin role to ${userEmail}`);
    process.exit(0);
  } catch (error) {
    console.error('Error making user admin:', error);
    process.exit(1);
  }
};

const userEmail = process.argv[2];

if (!userEmail) {
  console.error('Usage: node scripts/makeAdmin.js <user-email>');
  process.exit(1);
}

makeAdmin(userEmail);
