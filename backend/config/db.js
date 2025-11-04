const mongoose = require('mongoose');
const Role = require('../models/Role');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb'
    
    const conn = await mongoose.connect(MONGODB_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    
    await seedRolesIfNeeded();
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedRolesIfNeeded = async () => {
  try {
    const roleCount = await Role.countDocuments();
    
    if (roleCount === 0) {
      console.log('No roles found. Seeding default roles...');
      const roles = [
        {
          name: 'admin',
          permissions: ['read', 'write', 'delete'],
          description: 'Administrator with full access',
        },
        {
          name: 'user',
          permissions: ['read'],
          description: 'Regular user with read-only access',
        },
      ];
      
      const createdRoles = await Role.insertMany(roles);
      console.log(`✅ Created ${createdRoles.length} default roles:`);
      createdRoles.forEach(role => {
        console.log(`   - ${role.name}: ${role.permissions.join(', ')}`);
      });
    } else {
      console.log(`✅ Roles already exist (${roleCount} roles found)`);
    }
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

module.exports = connectDB;
