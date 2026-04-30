import bcrypt from "bcryptjs";
import { connectDB } from "./config/db";
import User from "./models/User";

async function resetDemoUsers() {
  try {
    await connectDB();

    const hashedPassword = await bcrypt.hash("password123", 10);

    const admin = await User.findOneAndUpdate(
      { email: "admin@example.com" },
      {
        name: "Admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        leader: null,
      },
      { upsert: true, new: true }
    );

    const leader = await User.findOneAndUpdate(
      { email: "leader12@example.com" },
      {
        name: "Leader Two",
        email: "leader12@example.com",
        password: hashedPassword,
        role: "LEADER",
        isActive: true,
        leader: null,
      },
      { upsert: true, new: true }
    );

    const member = await User.findOneAndUpdate(
      { email: "member12@example.com" },
      {
        name: "Member One",
        email: "member12@example.com",
        password: hashedPassword,
        role: "MEMBER",
        isActive: true,
        leader: leader._id,
      },
      { upsert: true, new: true }
    );

    console.log("Demo users reset successfully");
    console.log("Admin:", admin.email, "/ password123");
    console.log("Leader:", leader.email, "/ password123");
    console.log("Member:", member.email, "/ password123");

    process.exit(0);
  } catch (error) {
    console.error("Demo users reset failed:", error);
    process.exit(1);
  }
}

resetDemoUsers();