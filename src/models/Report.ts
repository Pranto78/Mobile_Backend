import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: Date,
    content: String,
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);