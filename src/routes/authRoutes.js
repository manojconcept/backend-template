import express from 'express';
import multer from "multer";

import userAgent from '../middleware/custome.js';

import {
    signup,
    verifyEmail,
    login,
    requestPasswordReset,
    resetPassword,
    refreshToken
} from '../controllers/authController.js';

const router = express.Router();
router.use(multer().array());

router.post('/signup',userAgent,signup);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/refresh-token', refreshToken);

export default router;
