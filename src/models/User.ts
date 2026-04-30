import mongoose from "mongoose";

export type Role = "ADMIN" | "LEADER" | "MEMBER";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "LEADER", "MEMBER"],
      required: true,
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);