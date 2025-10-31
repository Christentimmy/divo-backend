// src/routes/authRoutes.ts
import express from 'express';
import { authController } from '../controllers/auth_controller';

const router = express.Router();

// Original authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// PIN User routes (2-step process)
router.post('/pin/verify', authController.verifyPinUser);
router.post('/pin/signup', authController.signUpPinUser);

// Client (Reseller/IP) routes (2-step process)
router.post('/client/verify', authController.verifyClient);
router.post('/client/signup', authController.signUpClient);

export default router;