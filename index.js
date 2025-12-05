import dotenv from "dotenv";
dotenv.config();

import connectDB from "./src/config/db.js";
import { app } from "./src/app.js";

// Connect to DB
connectDB();

// Only listen if not in Vercel environment (Vercel handles the server itself)
if (process.env.NODE_ENV !== "production") {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running at port : ${process.env.PORT}`);
  });
}

// Export for Vercel
export default app;
