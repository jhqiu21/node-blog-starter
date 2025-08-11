import { pool } from '../db/pool.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { validationResult } from 'express-validator';

const signToken = (user) =>
  jwt.sign({ id: user.id, username: user.username }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

export const register = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    throw new HttpError(400, errors.array()[0].msg);
  }

  const { username, password } = req.body;
  const [rows] = await pool.query('SELECT id FROM users WHERE username=?', [username]);
  if (rows.length) {
    throw new HttpError(409, 'User already exists');
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    [username, password_hash]
  );
  const user = { id: result.insertId, username };
  const token = signToken(user);

  res.status(201).json({ user, token });
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError(400, errors.array()[0].msg);
  }
  
  const { username, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE username=?', [username]);
  if (!rows.length) {
    throw new HttpError(401, 'Username or password is incorrect');
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw new HttpError(401, 'Username or password is incorrect');
  }

  const token = signToken(user);
  res.json({ user: { id: user.id, username: user.username }, token });
};
