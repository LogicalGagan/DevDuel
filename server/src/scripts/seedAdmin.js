/**
 * Seed the admin account.
 *
 * Run once:  node src/scripts/seedAdmin.js
 *
 * If the admin already exists it will be skipped (no duplicates).
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.model.js';

dotenv.config();

const ADMIN_EMAIL    = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin@123';
const ADMIN_NAME     = 'Admin';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/devduel');
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      // Promote to admin if not already
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log(`✅ Existing user promoted to admin: ${ADMIN_EMAIL}`);
      } else {
        console.log(`ℹ️  Admin already exists: ${ADMIN_EMAIL}`);
      }
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD, // hashed by pre-save hook
        role: 'admin',
      });
      console.log(`✅ Admin account created: ${ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
