import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import deviceRouter from "./routes/device.routes.js";
import calendarRouter from "./routes/calendar.routes.js";
import gmailRouter from "./routes/gmail.routes.js";
import reminderRouter from "./routes/reminder.routes.js";
import notesRouter from "./routes/notes.routes.js";
import weatherRouter from "./routes/weather.routes.js";
import newsRouter from "./routes/news.routes.js";
import wikipediaRouter from "./routes/wikipedia.routes.js";
import searchRouter from "./routes/search.routes.js";
import musicRouter from "./routes/music.routes.js";
import translateRouter from "./routes/translate.routes.js";
import youtubeRouter from "./routes/youtube.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import geminiResponse from "./gemini.js";
import aiController from "./controllers/ai.controller.js";
import logger, { httpLogger, loggers } from "./utils/logger.enhanced.js";
import { errorHandler, notFoundHandler, setupErrorMonitoring } from "./middlewares/errorHandler.enhanced.js";
import { validateEnvVars } from "./utils/security.js";

// Load and validate env variables
dotenv.config();

// Validate required environment variables
validateEnvVars([
  'PORT',
  'MONGODB_URL',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'GEMINI_API_KEY',
  'GEMINI_API_URL'
]);

// Setup error monitoring
setupErrorMonitoring();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://orvionn.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

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
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// CORS Options
const corsOptions = {
  origin: function (origin, callback) {
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
app.options('*', cors(corsOptions));
app.use(httpLogger);

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
  res.send("✅ Backend is running!");
});

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
app.use("/api/device", deviceRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/gmail", gmailRouter);
app.use("/api/reminder", reminderRouter);
app.use("/api/notes", notesRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/news", newsRouter);
app.use("/api/wikipedia", wikipediaRouter);
app.use("/api/search", searchRouter);
app.use("/api/music", musicRouter);
app.use("/api/translate", translateRouter);
app.use("/api/youtube", youtubeRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Socket.io Connection Handler
io.on('connection', (socket) => {
  logger.info('Socket.io client connected', { socketId: socket.id });

  // Handle user command from voice/text
  socket.on('userCommand', async (data) => {
    try {
      const { command, userId, assistantName, userName } = data;
      loggers.voiceCommand(userId, command, { success: false, status: 'processing' });

      const result = await aiController.processCommand(command, userId, assistantName, userName);
      loggers.aiInteraction(userId, command, result, 'gemini');

      socket.emit('aiResponse', result);
      loggers.voiceCommand(userId, command, { success: true, status: 'completed' });
    } catch (error) {
      logger.error('Voice command error', { error: error.message, stack: error.stack });
      socket.emit('aiResponse', {
        type: 'error',
        response: 'I encountered an error processing your request.',
        error: error.message
      });
    }
  });

  // Handle keyboard chat messages with streaming
  socket.on('user-message', async (data) => {
    try {
      const { message, userId, mode } = data;
      logger.info('[KEYBOARD-CHAT] Processing message:', { message, userId, mode });

      // Import streaming service
      const { default: streamingService } = await import('./services/streamingService.js');

      // Stream the response
      await streamingService.streamResponse(socket, message, userId, aiController);

      logger.info('[KEYBOARD-CHAT] Message processed successfully');
    } catch (error) {
      logger.error('[KEYBOARD-CHAT] Error:', { error: error.message, stack: error.stack });
      socket.emit('error', {
        type: 'error',
        message: 'I encountered an error processing your message.',
        error: error.message
      });
    }
  });

  // Handle streaming voice commands
  socket.on('userCommand-stream', async (data) => {
    try {
      const { command, userId } = data;
      logger.info('[STREAMING] Processing command:', command);

      const { default: streamingService } = await import('./services/streamingService.js');
      await streamingService.streamResponse(socket, command, userId, aiController);
    } catch (error) {
      logger.error('[STREAMING] Error:', error);
      socket.emit('stream-error', { error: error.message });
    }
  });

  // Handle stream interruption
  socket.on('interrupt-stream', () => {
    logger.info('[STREAMING] Interrupt requested');
    socket.emit('stream-cancelled', { timestamp: new Date().toISOString() });
  });

  // Handle device control
  socket.on('deviceControl', async (data) => {
    try {
      logger.info('Device control command received', { socketId: socket.id, data });
      socket.emit('deviceResponse', {
        success: true,
        message: 'Device control requires device manager integration'
      });
    } catch (error) {
      logger.error('Device control failed', { socketId: socket.id, error: error.message });
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Socket.io client disconnected', { socketId: socket.id });
  });
});

// Start server
const port = process.env.PORT || 5000;
let server;

if (process.env.NODE_ENV !== 'test') {
  server = httpServer.listen(port, () => {
    connectDb();
    logger.info('Server started successfully', {
      port,
      environment: process.env.NODE_ENV,
      socketIO: 'enabled'
    });
  });
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app;
