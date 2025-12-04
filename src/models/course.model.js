import mongoose, { Schema } from "mongoose";

// QUIZ SCHEMA
// Each module can have a quiz with multiple questions
const quizQuestionSchema = new Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
});

const quizSchema = new Schema({
  title: { type: String, default: "Module Quiz" },
  questions: [quizQuestionSchema],
  passingScore: { type: Number, default: 70 },
});

// MODULE SCHEMA
// Each module contains video content and an optional quiz
const moduleSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  duration: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  quiz: quizSchema,
});

// ASSIGNMENT SCHEMA
// Each milestone ends with an assignment
const assignmentSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructions: { type: String },
  deadline: { type: Number, default: 7 },
  maxScore: { type: Number, default: 100 },
});

// MILESTONE SCHEMA
// A milestone contains multiple modules and ends with an assignment
const milestoneSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  order: { type: Number, required: true },
  modules: [moduleSchema],
  assignment: assignmentSchema,
});

// MAIN COURSE SCHEMA
const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    tags: [String],
    category: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    batch: {
      type: String,
      required: true, // e.g., "Batch 1", "January 2024 Cohort"
    },
    startDate: {
      type: Date,
      required: true,
    },
    milestones: [milestoneSchema],
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound Index for Search Optimization
courseSchema.index({ title: "text", tags: "text" });

export const Course = mongoose.model("Course", courseSchema);
