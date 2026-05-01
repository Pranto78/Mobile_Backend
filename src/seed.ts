import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User";
import { connectDB } from "./config/db";

async function seed() {
  try {
    await connectDB();

    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash("password123", 10);

    const admin = await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "ADMIN",
    });

    const leader = await User.create({
      name: "Leader",
      email: "leader@example.com",
      password: hashedPassword,
      role: "LEADER",
    });

    const member = await User.create({
      name: "Member",
      email: "member@example.com",
      password: hashedPassword,
      role: "MEMBER",
      leaderId: leader._id,
    });

    console.log("Seed completed successfully");
    console.log({
      admin: admin.email,
      leader: leader.email,
      member: member.email,
      password: "password123",
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();