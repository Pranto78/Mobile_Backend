import mongoose, { Document, Schema, Types } from "mongoose";

export type UserRole = "ADMIN" | "LEADER" | "MEMBER";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  leader?: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["ADMIN", "LEADER", "MEMBER"],
      required: true,
      default: "MEMBER",
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);