import mongoose, { Schema } from "mongoose";

// Sub-schema for individual lectures/modules
const lectureSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true }, // YouTube link
  isFree: { type: Boolean, default: false }, // For preview
  duration: { type: Number, default: 0 }, // in minutes
});

// Sub-schema for Batches (e.g., "Jan 2024 Cohort")
const batchSchema = new Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  limit: { type: Number, default: 50 },
  enrolledCount: { type: Number, default: 0 },
});

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true, // For search performance
    },
    description: {
      type: String,
      required: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User", // Link to the Admin
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    thumbnail: {
      type: String, // URL
      required: true,
    },
    tags: [String], // ["React", "Web Dev"]
    category: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    syllabus: [lectureSchema], // Array of lectures
    batches: [batchSchema], // Array of available batches
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound Index for Search Optimization (Title + Tags)
courseSchema.index({ title: "text", tags: "text" });

export const Course = mongoose.model("Course", courseSchema);
