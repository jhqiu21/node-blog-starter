import { pool } from '../db/pool.js';
import { HttpError } from '../utils/httpError.js';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { validationResult } from 'express-validator';

export const createPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError(400, errors.array()[0].msg);
  }

  const { title, content } = req.body;
  const cover = req.file ? `/uploads/${req.file.filename}` : null;

  const [result] = await pool.query(
    'INSERT INTO posts (title, content, cover_image, author_id) VALUES (?, ?, ?, ?)',
    [title, content, cover, req.user.id]
  );
  const [rows] = await pool.query('SELECT * FROM posts WHERE id=?', [result.insertId]);
  res.status(201).json(rows[0]);
};

export const listPosts = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10')));
  const offset = (page - 1) * limit;
  const search = (req.query.search || '').trim();

  const where = search ? 'WHERE p.title LIKE ? OR p.content LIKE ?' : '';
  const params = search ? [`%${search}%`, `%${search}%`] : [];

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) as total FROM posts p ${where}`,
    params
  );
  const [rows] = await pool.query(
    `SELECT p.*, u.username as author
     FROM posts p
     JOIN users u ON u.id = p.author_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    search ? [...params, limit, offset] : [limit, offset]
  );

  res.json({ page, limit, total, items: rows });
};

export const getPost = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, u.username as author
     FROM posts p JOIN users u ON u.id = p.author_id
     WHERE p.id=?`,
    [req.params.id]
  );
  if (!rows.length) {
    throw new HttpError(404, 'Article not found');
  }
  res.json(rows[0]);
};

export const updatePost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError(400, errors.array()[0].msg);
  }

  const id = req.params.id;
  const [rows] = await pool.query('SELECT * FROM posts WHERE id=?', [id]);
  if (!rows.length) {
    throw new HttpError(404, 'Article not found');
  }

  const post = rows[0];
  if (post.author_id !== req.user.id) {
    throw new HttpError(403, 'No permission to edit this article');
  }

  const { title = post.title, content = post.content } = req.body;
  let cover = post.cover_image;

  if (req.file) {
    if (cover) {
      try {
        const p = path.join(process.cwd(), cover.replace('/uploads', env.uploadDir));
        await fs.unlink(p);
      } catch {}
    }
    cover = `/uploads/${req.file.filename}`;
  }

  await pool.query(
    'UPDATE posts SET title=?, content=?, cover_image=? WHERE id=?',
    [title, content, cover, id]
  );

  const [updated] = await pool.query('SELECT * FROM posts WHERE id=?', [id]);
  res.json(updated[0]);
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const [rows] = await pool.query('SELECT * FROM posts WHERE id=?', [id]);
  if (!rows.length) {
    throw new HttpError(404, 'Article not found');
  }

  const post = rows[0];
  if (post.author_id !== req.user.id) {
    throw new HttpError(403, 'No permission to delete this article');
  }

  if (post.cover_image) {
    try {
      const p = path.join(process.cwd(), post.cover_image.replace('/uploads', env.uploadDir));
      await fs.unlink(p);
    } catch {}
  }

  await pool.query('DELETE FROM posts WHERE id=?', [id]);
  res.status(204).send();
};
