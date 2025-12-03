import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

//  Global Middlewares
app.use(helmet()); // Secure HTTP
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(morgan("dev")); // Log requests

// Import Routes
import authRouter from "./routes/auth.routes.js";
import courseRouter from "./routes/course.routes.js";

// Use Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/courses", courseRouter);

// Global Error Handler
import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);

export { app };
