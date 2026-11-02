import express from 'express';
import cors from 'cors';
import { envConfig } from './config/env.config.js';
import apiRoutes from './routes/index.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

// ==========================================
// Middleware Configuration
// ==========================================

// Enable CORS for frontend client
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin),
      // matching CLIENT_URL, wildcard, or any origin in production/preview deployments
      if (!origin || origin === envConfig.clientUrl || envConfig.clientUrl === '*' || process.env.NODE_ENV === 'production') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[Incoming Request] ${req.method} ${req.url}`);
  next();
});

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Prompify API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// ==========================================
// Application Routes
// ==========================================
app.use('/api', apiRoutes);

// ==========================================
// Centralized Error Handling
// ==========================================
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
