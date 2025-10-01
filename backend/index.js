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
  'GEMINI_API_KEY',
  'GEMINI_API_URL'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
});

const app = express();

// CORS configuration
const allowedOrigins = [
  'https://orvionn.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...allowedOrigins],
      imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes only
app.use('/api/', limiter);

// CORS Options
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Set-Cookie'],
  exposedHeaders: ['Access-Control-Allow-Origin', 'Set-Cookie']
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

// Gemini API route
app.post("/api/gemini", async (req, res) => {
  try {
    const { command, assistantName, userName } = req.body;
    const response = await geminiResponse(command, assistantName, userName);
    res.json({ success: true, result: response });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Gemini response"
    });
  }
});


// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

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
