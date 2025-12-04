import { z } from "zod";

const quizQuestionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).min(2, "At least 2 options are required"),
  correctAnswer: z.number().min(0, "Correct answer index is required"),
});

const quizSchema = z.object({
  title: z.string().min(1, "Quiz title is required"),
  questions: z.array(quizQuestionSchema).optional(),
  passingScore: z.number().min(0).max(100).default(70),
});

const moduleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  description: z.string().optional(),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
  duration: z.number().min(0).optional(),
  isFree: z.boolean().default(false),
  quiz: quizSchema.optional(),
});

const assignmentSchema = z.object({
  title: z.string().min(1, "Assignment title is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  maxScore: z.number().min(1).default(100),
  deadline: z.string().optional(), // ISO Date string
});

const milestoneSchema = z.object({
  title: z.string().min(1, "Milestone title is required"),
  description: z.string().optional(),
  modules: z.array(moduleSchema).optional(),
  assignment: assignmentSchema.optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price cannot be negative"),
  category: z.string().min(1, "Category is required"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().url("Invalid thumbnail URL").optional().or(z.literal("")),
  batch: z.string().min(1, "Batch name is required"),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date",
  }),
  milestones: z.array(milestoneSchema).optional(),
});

export const updateCourseSchema = createCourseSchema.partial();
