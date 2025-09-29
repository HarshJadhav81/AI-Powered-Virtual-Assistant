import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import geminiResponse from "./gemini.js"; // if you’re using it

// Load env variables (only for PORT/DB)
dotenv.config();

const app = express();

// ✅ CORS setup for your frontend
app.use(cors({
  origin: "https://orvionn.vercel.app", // deployed frontend
  credentials: true
}));

// Middlewares
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("✅ Backend is running on Render!");
});

// ✅ Test route (to confirm APIs work)
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "API is working fine 🎉" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  connectDb();
  console.log(`Server started on port ${port}`);
});
