import express from 'express';
import multer from "multer";

import userAgent from '../middleware/custome.js';

import {
    signup,
    verifyEmail,
    login,
    requestPasswordReset,
    resetPassword,
    refreshToken,
    verifyPasswordReset
} from '../controllers/authController.js';

const router = express.Router();
router.use(multer().array());

router.post('/signup',userAgent,signup);
router.get('/verify/:token', verifyEmail);
router.post('/login', login);
router.get('/logout',verifyPasswordReset)
router.post('/request-password-reset', requestPasswordReset); // pending...
router.post('/reset-password', resetPassword); // pending...
router.get('/refresh-token', refreshToken);
router.get('/getcookie',verifyPasswordReset);

export default router;
