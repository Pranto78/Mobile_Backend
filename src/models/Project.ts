import mongoose, { Document, Schema, Types } from "mongoose";

export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface IProject extends Document {
  name: string;
  description?: string;
  status: ProjectStatus;
  isVisible: boolean;
  createdBy: Types.ObjectId;
  assignedLeaders: Types.ObjectId[];
  assignedMembers: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedLeaders: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignedMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);