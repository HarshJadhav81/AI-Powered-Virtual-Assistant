import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import geminiResponse from "./gemini.js"; // if you’re using it

// Load and validate env variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'MONGODB_URL',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'NODE_ENV'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
});

const app = express();

// Security middlewares
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    callback(null, true); // Allow all origins temporarily for debugging
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Access-Control-Allow-Origin']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/", (req, res) => {
  res.send("✅ Backend is running on Render!");
});

// ✅ Test route (to confirm APIs work)
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "API is working fine 🎉" });
});

// Routes with error handling
app.use("/api/auth", (req, res, next) => {
  try {
    authRouter(req, res, next);
  } catch (error) {
    next(error);
  }
});

app.use("/api/user", (req, res, next) => {
  try {
    userRouter(req, res, next);
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use((req, res, next) => {
  if (!req.route) {
    return res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'TypeError' && err.message.includes('pathToRegexpError')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL format'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server, just log the error
});

// Start server
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  connectDb();
  console.log(`Server started on port ${port} in ${process.env.NODE_ENV} mode`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
