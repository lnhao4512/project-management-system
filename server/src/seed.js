require('dotenv').config();
const connectDB = require('./config/database');
const User = require('./modules/users/user.model');

const seedAdmin = async () => {
  await connectDB();

  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
  }

  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'System Admin',
    email: process.env.ADMIN_EMAIL || 'admin@company.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    role: 'admin',
    isActive: true,
  });

  console.log('Admin seeded:', admin.email);
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
