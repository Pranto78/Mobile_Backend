import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User";
import { connectDB } from "./config/db";

async function seed() {
  await connectDB();

  await User.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await User.create({
    name: "Admin",
    email: "admin@example.com",
    passwordHash,
    role: "ADMIN",
  });

  const leader = await User.create({
    name: "Leader",
    email: "leader@example.com",
    passwordHash,
    role: "LEADER",
  });

  const member = await User.create({
    name: "Member",
    email: "member@example.com",
    passwordHash,
    role: "MEMBER",
    leaderId: leader._id,
  });

  console.log({ admin, leader, member });

  process.exit();
}

seed();