import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    throw new HttpError(401, 'Unauthorized');
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = payload; // { id, username }
    next();
  } catch {
    throw new HttpError(401, 'Token is invalid or expired');
  }
};
