import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';

const app = express();

/* ----- security and proxy ----- */

// 告诉 Express：应用运行在反向代理后面（如 Nginx/Caddy），正确识别 x-forwarded-* 和 req.secure
app.set('trust proxy', 1);

// use HTTPS to protect data in transit
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

// Helmet is a middleware that helps secure Express apps by setting various HTTP headers
app.use(helmet());

// use HSTS (HTTP Strict Transport Security) to enforce HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use(
    helmet.hsts({
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true,
    })
  );
}

/* ----- set up CORS ----- */
const allowlist = ['https://your-frontend.example.com']; // TODO: set your frontend URL here
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) {
        return cb(null, true); // allow same-origin / non-browser clients
      }
      return cb(null, allowlist.includes(origin));
    },
    credentials: true,
  })
);

/* ----- logging and parsers ----- */
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ----- rate limiting ----- */
// Global rate limit: 200 requests per 15 minutes
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// more strict rate limit for auth routes
// 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

/* ----- static resources (uploaded images) ----- */
app.use(
  '/uploads',
  express.static(env.uploadDir, {
    fallthrough: false, // 404 if not found
    immutable: true,
    maxAge: '7d',
  })
);

/* ----- health check ----- */
app.get('/health', (req, res) => res.json({ status: 'ok' }));

/* ----- business routes ----- */
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

/* ----- 404 and error handling ----- */
app.use(notFound);
app.use(errorHandler);

export default app;
