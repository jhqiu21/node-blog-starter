import { Router } from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/auth.controller.js';

const router = Router();

const usernameRule = body('username').isLength({ min: 3, max: 50 }).withMessage('Username must be 3 ~ 50 characters');
const passwordRule = body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters');

router.post('/register', [usernameRule, passwordRule], register);
router.post('/login', [usernameRule, passwordRule], login);

export default router;
