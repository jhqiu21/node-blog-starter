import multer from 'multer';
import { env } from '../config/env.js';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { HttpError } from '../utils/httpError.js';

const ensureDir = async (dir) => {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
};

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDir(env.uploadDir);
    cb(null, env.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) return cb(new HttpError(400, 'Only supports png/jpg/jpeg/webp'), false);
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
});
