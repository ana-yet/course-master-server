const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  contentUrl: String,
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A course must have a title'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'A course must have a description'],
    },
    price: {
      type: Number,
      required: [true, 'A course must have a price'],
    },
    instructor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A course must have an instructor'],
    },
    syllabus: [syllabusSchema],
    batches: [
      {
        type: String, // e.g., "Batch A - Jan 2025"
      },
    ],
    thumbnail: {
      type: String,
      default: 'default-course.png',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
