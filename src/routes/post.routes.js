import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  createPost, listPosts, getPost, updatePost, deletePost
} from '../controllers/post.controller.js';

const router = Router();

const idParam = param('id').isInt().toInt().withMessage('Invalid post ID');
const titleRequired = body('title').isLength({ min: 1, max: 200 }).withMessage('Title must be 1 ~ 200 characters');
const contentRequired = body('content').isLength({ min: 1 }).withMessage('Content is required');
const titleOptional = body('title').optional().isLength({ min: 1, max: 200 });
const contentOptional = body('content').optional().isLength({ min: 1 });

router.get('/', listPosts);
router.get('/:id', [idParam], getPost);

router.post(
  '/',
  requireAuth,
  upload.single('cover'),
  [titleRequired, contentRequired],
  createPost
);

router.put(
  '/:id',
  requireAuth,
  upload.single('cover'),
  [idParam, titleOptional, contentOptional],
  updatePost
);

router.delete('/:id', requireAuth, [idParam], deletePost);

export default router;
