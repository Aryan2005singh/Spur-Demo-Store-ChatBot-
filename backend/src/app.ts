import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { createChatRouter } from './routes/chat.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { ChatService } from './services/chat.service.js';
import { createLLMProvider } from './services/llm/llm.factory.js';
import { logger } from './utils/logger.js';

// ─── Validate required env vars at startup ───────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'GROQ_API_KEY'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10);

// ─── Dependency injection ─────────────────────────────────────────────────────
const llmProvider = createLLMProvider();
const chatService = new ChatService(llmProvider);

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      // In production, restrict to configured origin(s)
      if (NODE_ENV === 'production') {
        const allowedOrigins = CORS_ORIGIN.split(',').map((o) => o.trim());
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS: origin "${origin}" not allowed`), false);
      }
      // In development, allow all origins
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Body parsing — limit request size to prevent payload attacks
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Rate limiting — applied before routes
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests. Please wait a moment and try again.',
      code: 'RATE_LIMITED',
    },
    skip: (req) => req.path === '/health', // Don't rate-limit health checks
  }),
);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check — used by Render to verify the service is up
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Chat routes
app.use('/chat', createChatRouter(chatService));

// 404 handler — must come after all routes
app.use(notFoundHandler);

// Global error handler — must be last
app.use(errorHandler);

// ─── Server ───────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${NODE_ENV}]`);
  logger.info(`CORS origin: ${CORS_ORIGIN}`);
  logger.info(`LLM provider: ${llmProvider.providerName}`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Shutting down gracefully…`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
  // Force exit after 10s if shutdown stalls
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  void shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  void shutdown('unhandledRejection');
});

export default app;
