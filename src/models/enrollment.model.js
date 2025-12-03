import mongoose, { Schema } from "mongoose";

const enrollmentSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    // store the ID of the lectures that are finished
    completedLessons: [
      {
        type: String, // Storing the _id of the sub-document
      },
    ],
    progress: {
      type: Number, // Percentage (0-100)
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "refunded"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Prevent duplicate enrollment
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
