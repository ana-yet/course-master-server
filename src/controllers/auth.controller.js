import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

// Cookie options
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // Secure in prod only
  sameSite: "strict",
};

const registerUser = asyncHandler(async (req, res) => {
  // Input is already validated by middleware
  const { name, email, password, role } = req.body;

  // 1. Check if user exists
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  // 2. Create User
  const user = await User.create({
    name,
    email,
    password,
    role: role || "student",
  });

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Input is already validated by middleware
  const { email, password } = req.body;

  // 2. Find User
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // 3. Check Password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // 4. Generate Token
  const accessToken = user.generateAccessToken();

  const loggedInUser = await User.findById(user._id).select("-password");

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length < 2) {
    throw new ApiError(400, "Name must be at least 2 characters");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name: name.trim() },
    { new: true }
  ).select("-password");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

export { registerUser, loginUser, logoutUser, getCurrentUser, updateUser };

