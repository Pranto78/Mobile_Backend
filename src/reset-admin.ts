import bcrypt from "bcryptjs";
import { connectDB } from "./config/db";
import User from "./models/User";

async function resetAdmin() {
  try {
    await connectDB();

    const hashedPassword = await bcrypt.hash("password123", 10);

    await User.findOneAndUpdate(
      { email: "admin@example.com" },
      {
        name: "Admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        leader: null,
      },
      {
        upsert: true,
        new: true,
      }
    );

    console.log("Admin reset successfully");
    console.log("Email: admin@example.com");
    console.log("Password: password123");

    process.exit(0);
  } catch (error) {
    console.error("Admin reset failed:", error);
    process.exit(1);
  }
}

resetAdmin();