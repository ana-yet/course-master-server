import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";

// Cookie options
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // Secure in prod only
  sameSite: "strict",
};

const registerUser = asyncHandler(async (req, res) => {
  // 1. Validate Input
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ApiError(400, validation.error.errors[0].message);
  }

  const { name, email, password, role } = validation.data;

  // 2. Check if user exists
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  // 3. Create User
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
  // 1. Validate Input
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ApiError(400, validation.error.errors[0].message);
  }

  const { email, password } = validation.data;

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

export { registerUser, loginUser, logoutUser, getCurrentUser };
