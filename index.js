import dotenv from "dotenv";
dotenv.config();

import connectDB from "./src/config/db.js";
import { app } from "./src/app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
