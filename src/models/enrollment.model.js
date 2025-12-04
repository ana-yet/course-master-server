import mongoose, { Schema } from "mongoose";

// Track quiz attempts
const quizAttemptSchema = new Schema({
  moduleId: { type: String, required: true },
  score: { type: Number, required: true },
  passed: { type: Boolean, default: false },
  attemptedAt: { type: Date, default: Date.now },
});

// Track assignment submissions
const assignmentSubmissionSchema = new Schema({
  milestoneId: { type: String, required: true },
  submissionUrl: { type: String, required: true }, // GitHub link, file URL, etc.
  submittedAt: { type: Date, default: Date.now },
  score: { type: Number, default: null }, // Instructor grades it later
  feedback: { type: String },
  status: {
    type: String,
    enum: ["pending", "reviewed", "approved", "rejected"],
    default: "pending",
  },
});

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
    // Payment info
    paymentId: { type: String }, // Stripe payment intent ID
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "refunded"],
      default: "pending",
    },
    amountPaid: { type: Number, default: 0 },
    // Progress tracking - store completed module IDs
    completedModules: [{ type: String }],
    // Quiz tracking
    quizAttempts: [quizAttemptSchema],
    // Assignment tracking
    assignmentSubmissions: [assignmentSubmissionSchema],
    // Overall progress
    progress: {
      type: Number,
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
