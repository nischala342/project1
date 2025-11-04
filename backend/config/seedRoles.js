const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb'

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

const seedRoles = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Role.deleteMany({});
    console.log('Cleared existing roles');

    const createdRoles = await Role.insertMany(roles);
    console.log(`Created ${createdRoles.length} roles:`);
    createdRoles.forEach(role => {
      console.log(`  - ${role.name}: ${role.permissions.join(', ')}`);
    });

    console.log('Roles seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedRoles();
}

module.exports = seedRoles;
