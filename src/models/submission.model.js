import mongoose, { Schema } from "mongoose";

const submissionSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lessonId: { type: String, required: true }, // Links to specific syllabus item
    type: { type: String, enum: ["assignment", "quiz"], required: true },
    content: { type: String }, // Google Drive Link or Text
    score: { type: Number, default: 0 }, // For Quizzes
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Submission = mongoose.model("Submission", submissionSchema);
