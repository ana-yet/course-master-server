import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Submission } from "../models/submission.model.js";

export const submitAssignment = asyncHandler(async (req, res) => {
  const { courseId, lessonId, content, type, score } = req.body;
  const userId = req.user._id;

  const submission = await Submission.create({
    student: userId,
    course: courseId,
    lessonId,
    content,
    type,
    score: score || 0,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, submission, "Submitted successfully"));
});
