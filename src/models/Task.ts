import mongoose, { Document, Schema, Types } from "mongoose";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "PAUSE" | "DONE";

export interface ITask extends Document {
  title: string;
  description?: string;
  project: Types.ObjectId;
  assignedTo: Types.ObjectId;
  createdBy: Types.ObjectId;
  status: TaskStatus;
  timeSpentSeconds: number;
  currentStartedAt?: Date | null;
  isLocked: boolean;
  carryOverFrom?: Types.ObjectId | null;
  taskDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "PAUSE", "DONE"],
      default: "TODO",
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    currentStartedAt: {
      type: Date,
      default: null,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    carryOverFrom: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    taskDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);