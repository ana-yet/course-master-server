import Stripe from "stripe";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";

// Lazy-initialize Stripe to avoid errors when env vars aren't loaded yet
let stripe = null;

const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new ApiError(500, "Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file.");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// @desc    Create Stripe Checkout Session
// @route   POST /api/v1/payments/create-checkout-session
// @access  Private
const createCheckoutSession = asyncHandler(async (req, res) => {
  const stripeClient = getStripe();
  const { courseId } = req.body;
  const userId = req.user._id;

  // 1. Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // 2. Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });

  if (existingEnrollment && existingEnrollment.paymentStatus === "completed") {
    throw new ApiError(409, "You are already enrolled in this course");
  }

  // 3. Create Stripe Checkout Session
  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: course.title,
            description: course.description.substring(0, 200),
            images: [course.thumbnail],
          },
          unit_amount: Math.round(course.price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      courseId: courseId.toString(),
      userId: userId.toString(),
    },
    success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/courses/${courseId}`,
  });

  // 4. Create pending enrollment
  if (!existingEnrollment) {
    await Enrollment.create({
      student: userId,
      course: courseId,
      paymentId: session.id,
      paymentStatus: "pending",
      amountPaid: course.price,
    });
  } else {
    // Update existing pending enrollment
    existingEnrollment.paymentId = session.id;
    await existingEnrollment.save();
  }

  return res.status(200).json(
    new ApiResponse(200, { sessionId: session.id, url: session.url }, "Checkout session created")
  );
});

// @desc    Verify Payment Success
// @route   POST /api/v1/payments/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const stripeClient = getStripe();
  const { sessionId } = req.body;

  // 1. Retrieve session from Stripe
  const session = await stripeClient.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new ApiError(400, "Payment not completed");
  }

  // 2. Find and update enrollment
  const enrollment = await Enrollment.findOne({ paymentId: sessionId });

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  if (enrollment.paymentStatus === "completed") {
    return res.status(200).json(
      new ApiResponse(200, enrollment, "Payment already verified")
    );
  }

  // 3. Mark as completed
  enrollment.paymentStatus = "completed";
  enrollment.status = "active";
  await enrollment.save();

  return res.status(200).json(
    new ApiResponse(200, enrollment, "Payment verified successfully")
  );
});

// @desc    Stripe Webhook Handler
// @route   POST /api/v1/payments/webhook
// @access  Public (Stripe calls this)
const stripeWebhook = asyncHandler(async (req, res) => {
  const stripeClient = getStripe();
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Update enrollment
    const enrollment = await Enrollment.findOne({ paymentId: session.id });
    if (enrollment) {
      enrollment.paymentStatus = "completed";
      enrollment.status = "active";
      await enrollment.save();
    }
  }

  res.status(200).json({ received: true });
});

export { createCheckoutSession, verifyPayment, stripeWebhook };
