import { Router } from "express";
import {
  createCheckoutSession,
  verifyPayment,
  stripeWebhook,
} from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import express from "express";

const router = Router();

// Stripe webhook needs raw body, so we handle it specially
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// Protected routes
router.post("/create-checkout-session", verifyJWT, createCheckoutSession);
router.post("/verify", verifyJWT, verifyPayment);

export default router;
