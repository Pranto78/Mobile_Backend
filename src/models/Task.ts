import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "PAUSE", "DONE"],
      default: "TODO",
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    assignedToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isCarryOver: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },

    startedAt: Date,
    totalSeconds: { type: Number, default: 0 },

    taskDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);