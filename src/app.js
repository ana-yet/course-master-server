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
    origin:
      process.env.CORS_ORIGIN ||
      "http://localhost:3000" ||
      "https://ana-yet-course-master-client.vercel.app",
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
import enrollmentRouter from "./routes/enrollment.routes.js";
import adminRouter from "./routes/admin.routes.js";
import submissionRouter from "./routes/submission.routes.js";
import paymentRouter from "./routes/payment.routes.js";

// Use Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/enrollments", enrollmentRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/payments", paymentRouter);

// Global Error Handler
import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);

export { app };
