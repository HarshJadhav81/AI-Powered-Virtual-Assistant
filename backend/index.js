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
import latencyMonitor from "./services/latencyMonitor.js";
import diagnosticLogger from "./services/diagnosticLogger.js";
import fastIntentService from "./services/fastIntentService.js";
import acknowledgmentService from "./services/acknowledgmentService.js";
import disambiguationService from "./services/disambiguationService.js";
import safetyService from "./services/safetyService.js";

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

// Initialize Socket.io with CORS and OPTIMIZATIONS
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://orvion.vercel.app',
      'https://orvionn.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  },
  // PERFORMANCE OPTIMIZATIONS
  perMessageDeflate: {
    threshold: 1024, // Compress messages larger than 1KB
    zlibDeflateOptions: {
      chunkSize: 8 * 1024,
      memLevel: 7,
      level: 3 // Compression level (0-9, 3 is good balance)
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    }
  },
  httpCompression: {
    threshold: 1024
  },
  transports: ['websocket', 'polling'], // Prefer WebSocket
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6 // 1MB
});

// CORS configuration
const allowedOrigins = [
  'https://orvion.vercel.app',
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

// Self-test endpoint
app.get("/api/self-test", async (req, res) => {
  try {
    const { default: selfTestService } = await import('./services/selfTest.js');
    const report = await selfTestService.runAllTests();
    res.json({ success: true, report });
  } catch (error) {
    console.error("Self-test error:", error);
    res.status(500).json({
      success: false,
      message: "Self-test failed",
      error: error.message
    });
  }
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

  // Handle user command from voice/text with ADVANCED FEATURES
  socket.on('userCommand', async (data) => {
    const sessionId = `session_${Date.now()}_${socket.id}`;

    try {
      const { command, userId, assistantName, userName } = data;

      // START LATENCY TRACKING
      latencyMonitor.startSession(sessionId);
      latencyMonitor.recordTimestamp(sessionId, 'sttComplete', { transcript: command });

      // FAST INTENT DETECTION
      const fastIntent = fastIntentService.detectIntent(command);
      latencyMonitor.recordTimestamp(sessionId, 'nluComplete', {
        intent: fastIntent?.type,
        confidence: fastIntent?.confidence
      });

      // INSTANT ACKNOWLEDGMENT
      if (fastIntent && acknowledgmentService.shouldAcknowledge(fastIntent.confidence)) {
        const ack = acknowledgmentService.getAcknowledgment(fastIntent.type, fastIntent.confidence);
        if (ack) {
          socket.emit('acknowledgment', { text: ack.text, intent: fastIntent.type });
          latencyMonitor.recordTimestamp(sessionId, 'ackSent');
        }
      } else {
        socket.emit('command-received', {
          timestamp: new Date().toISOString(),
          command: command
        });
      }

      loggers.voiceCommand(userId, command, { success: false, status: 'processing' });

      // CHECK FOR SAFETY CONFIRMATION
      if (fastIntent && safetyService.requiresConfirmation(fastIntent.type)) {
        const confirmation = safetyService.requestConfirmation(sessionId, fastIntent);
        socket.emit('confirmation-required', confirmation);
        socket.emit('aiResponse', {
          type: 'confirmation',
          response: confirmation.message,
          requiresConfirmation: true
        });
        return;
      }

      latencyMonitor.recordTimestamp(sessionId, 'responseGenStart');
      const result = await aiController.processCommand(command, userId, assistantName, userName, fastIntent);
      latencyMonitor.recordTimestamp(sessionId, 'complete');

      loggers.aiInteraction(userId, command, result, 'gemini');

      socket.emit('aiResponse', result);
      loggers.voiceCommand(userId, command, { success: true, status: 'completed' });

      // LOG DIAGNOSTICS
      diagnosticLogger.logWithWarnings(sessionId, {
        transcript: command,
        intent: result.type,
        confidence: fastIntent?.confidence || 0.7,
        action_executed: result.type
      });
    } catch (error) {
      logger.error('Voice command error', { error: error.message, stack: error.stack });

      diagnosticLogger.log(sessionId, {
        transcript: data.command,
        errors: error.message,
        intent: 'error'
      });

      socket.emit('aiResponse', {
        type: 'error',
        response: 'I encountered an error processing your request.',
        error: error.message
      });
    }
  });

  // Handle keyboard chat messages with streaming + ADVANCED FEATURES
  socket.on('user-message', async (data) => {
    const sessionId = `session_${Date.now()}_${socket.id}`;

    try {
      const { message, userId, mode } = data;
      logger.info('[KEYBOARD-CHAT] Processing message:', { message, userId, mode, sessionId });

      // START LATENCY TRACKING
      latencyMonitor.startSession(sessionId);
      latencyMonitor.recordTimestamp(sessionId, 'sttComplete', { transcript: message });

      // Check for pending disambiguation
      if (disambiguationService.hasActiveDisambiguation(sessionId)) {
        const resolution = disambiguationService.resolveDisambiguation(sessionId, message);

        if (resolution.action === 'execute') {
          // Execute previously ambiguous command
          const { default: streamingService } = await import('./services/streamingService.js');
          await streamingService.streamResponse(socket, resolution.originalInput, userId, aiController, mode || 'chat');
          return;
        } else if (resolution.action === 'retry') {
          socket.emit('clarification', { question: resolution.question });
          return;
        } else if (resolution.action === 'cancel' || resolution.action === 'giveup') {
          socket.emit('message', { text: resolution.message || 'Okay, cancelled.' });
          return;
        }
      }

      // Check for pending safety confirmation
      if (safetyService.hasPendingConfirmation(sessionId)) {
        const verification = safetyService.verifyConfirmation(sessionId, message);

        if (verification.confirmed) {
          socket.emit('message', { text: verification.message });
          // Execute the confirmed action
          const { default: streamingService } = await import('./services/streamingService.js');
          await streamingService.streamResponse(socket, verification.intent.userInput, userId, aiController, mode || 'voice');
          return;
        } else if (verification.cancelled) {
          socket.emit('message', { text: verification.message });
          return;
        } else if (verification.unclear || verification.expired) {
          socket.emit('message', { text: verification.message });
          return;
        }
      }

      // FAST INTENT DETECTION
      const fastIntent = fastIntentService.detectIntent(message);
      latencyMonitor.recordTimestamp(sessionId, 'nluComplete', {
        intent: fastIntent?.type,
        confidence: fastIntent?.confidence
      });

      // INSTANT ACKNOWLEDGMENT (if fast intent found with high confidence)
      if (fastIntent && acknowledgmentService.shouldAcknowledge(fastIntent.confidence)) {
        const ack = acknowledgmentService.getAcknowledgment(fastIntent.type, fastIntent.confidence);
        if (ack) {
          socket.emit('acknowledgment', { text: ack.text, intent: fastIntent.type });
          latencyMonitor.recordTimestamp(sessionId, 'ackSent');
        }
      }

      // CHECK FOR SAFETY-SENSITIVE ACTIONS
      if (fastIntent && safetyService.requiresConfirmation(fastIntent.type)) {
        const confirmation = safetyService.requestConfirmation(sessionId, fastIntent);
        socket.emit('confirmation-required', confirmation);
        socket.emit('message', { text: confirmation.message });
        return;
      }

      // CHECK FOR DISAMBIGUATION
      if (fastIntent && disambiguationService.needsClarification(fastIntent.confidence)) {
        const clarification = disambiguationService.generateClarificationQuestion(fastIntent);
        disambiguationService.startDisambiguation(sessionId, clarification);
        socket.emit('clarification', clarification);
        socket.emit('message', { text: clarification.question });
        return;
      }

      // INSTANT ACKNOWLEDGMENT - Send immediately (fallback)
      socket.emit('message-received', {
        timestamp: new Date().toISOString(),
        message: message
      });

      // Import streaming service
      const { default: streamingService } = await import('./services/streamingService.js');

      // Stream the response in CHAT mode (optimized for conversational responses)
      latencyMonitor.recordTimestamp(sessionId, 'responseGenStart');
      await streamingService.streamResponse(socket, message, userId, aiController, mode || 'chat');
      latencyMonitor.recordTimestamp(sessionId, 'complete');

      // LOG DIAGNOSTICS
      diagnosticLogger.logWithWarnings(sessionId, {
        transcript: message,
        intent: fastIntent?.type || 'unknown',
        confidence: fastIntent?.confidence || 0.0,
        action_executed: fastIntent?.type || mode || 'chat'
      });

      logger.info('[KEYBOARD-CHAT] Message processed successfully');
    } catch (error) {
      logger.error('[KEYBOARD-CHAT] Error:', { error: error.message, stack: error.stack });

      // LOG ERROR
      diagnosticLogger.log(sessionId, {
        transcript: data.message,
        errors: error.message,
        intent: 'error'
      });

      // Send instant error feedback
      socket.emit('stream-token', {
        content: 'I apologize, I encountered an error processing your message. Please try again.',
        index: 0,
        final: true
      });

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
      logger.info('[STREAMING] Processing voice command:', command);

      const { default: streamingService } = await import('./services/streamingService.js');
      // Use 'voice' mode for voice commands (maintains JSON intent structure)
      await streamingService.streamResponse(socket, command, userId, aiController, 'voice');
    } catch (error) {
      logger.error('[STREAMING] Error:', error);
      socket.emit('stream-error', { error: error.message });
    }
  });

  // [NEW] Handle partial transcripts for incremental NLU
  socket.on('partial-transcript', async (data) => {
    try {
      const { partial, userId } = data;

      // Detect early intent prediction
      const partialIntent = fastIntentService.detectPartialIntent(partial);

      if (partialIntent && partialIntent.confidence > 0.7) {
        logger.info('[INCREMENTAL-NLU] Early prediction:', {
          partial,
          intent: partialIntent.type,
          confidence: partialIntent.confidence
        });

        // Send early prediction to frontend
        socket.emit('partial-intent', {
          intent: partialIntent.type,
          confidence: partialIntent.confidence,
          partial: partial
        });

        // Pre-fetch data if applicable (e.g., weather, news)
        // This can be implemented per intent type
      }
    } catch (error) {
      logger.error('[PARTIAL-TRANSCRIPT] Error:', error);
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
