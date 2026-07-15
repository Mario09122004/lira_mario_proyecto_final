import { Router } from 'express';
import { login, register } from '../controllers/auth.controller.js';
import { validate, loginSchema, registerSchema } from '../middlewares/validate.middleware.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', authenticateToken, validate(registerSchema), register);

export default router;
