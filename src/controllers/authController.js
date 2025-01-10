import UserModel from "../models/Users.js";
import sendMail from "../config/email.js";
import { genJwtToken, jwtVerifier } from "../config/authentication.js";

export const signup = async (req, res) => {
    const { email, username, password, phone } = req.body;
    try {
        const existingUser = await UserModel.findOne({ email });
        const existingUserName = await UserModel.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });
        if (existingUserName) return res.status(400).json({ message: 'Username already exists' });
        const newUser = new UserModel({ email, username, password, phone });
        const savedUser = await newUser.save();
        const verificationToken = genJwtToken({ id: savedUser._id });
        savedUser.verificationToken = verificationToken;
        savedUser.verificationTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
        await savedUser.save();

        const verificationUrl = `http://localhost:3300/auth/verify/${verificationToken}`;
        await sendMail({
            to: email,
            subject: 'Verify your email',
            text: `Please verify your email by clicking this link: ${verificationUrl}`
        })

        res.status(201).json({ message: 'User created successfully, please verify your email.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
// Email Verification
export const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwtVerifier(token);
        const user = await UserModel.findById(decoded.id);

        if (!user || !user.verificationToken || user.verificationToken !== token || Date.now() > user.verificationTokenExpiry) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined; // Clear the verification token
        user.verificationTokenExpiry = undefined; // Clear the expiry
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
// Login
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (!user.isVerified) {
            // Check if the verification token is expired
            if (!user.verificationToken || Date.now() > user.verificationTokenExpiry) {
                // Generate a new verification token
                const newVerificationToken = genJwtToken({ id: user._id });
                user.verificationToken = newVerificationToken;
                user.verificationTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes from now
                await user.save();

                // Send a new verification email
                const verificationUrl = `http://localhost:3300/auth/verify/${newVerificationToken}`;
                await sendMail({
                    to: email,
                    subject: 'Verify your email (Reverification)',
                    text: `Please verify your email by clicking this link: ${verificationUrl}`
                });

                return res.status(400).json({ message: 'Verification email expired. A new verification email has been sent to your inbox.' });
            }

            return res.status(400).json({ message: 'User not verified. Please check your email for verification.' });
        }

        //This is the mothod, check in userModel.js
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT tokens
        const accessToken = genJwtToken({ id: user._id });
        const refreshToken = genJwtToken(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET_KEY,
            process.env.JWT_REFRESH_TOKEN_LIFE
        );

        // Save refresh token in the database
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
// Request Password Reset
export const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        // Generate a reset token
        const resetToken = genJwtToken({ id: user._id });
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        // Send password reset email
        const resetUrl = `http://localhost:3000/auth/reset-password/${resetToken}`;
        await sendMail({
            to: email,
            subject: 'Reset your password',
            text: `Please reset your password by clicking this link: ${resetUrl}`,
        })

        res.status(200).json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
// Reset Password
export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwtVerifier(token);
        const user = await UserModel.findById(decoded.id);

        if (!user || !user.resetToken || user.resetToken !== token || Date.now() > user.resetTokenExpiry) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = newPassword;
        user.resetToken = undefined; // Clear the reset token
        user.resetTokenExpiry = undefined; // Clear the expiry
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
// Refresh Token
export const refreshToken = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: 'Refresh token required' });
    try {
        const decoded = jwtVerifier(token, process.env.REFRESH_TOKEN_SECRET_KEY);
        const user = await UserModel.findById(decoded.id);
        if (!user) return res.sendStatus(403).json({ message: 'User not found' });
        // Check if the provided refresh token matches the one stored in the database
        if (user.refreshToken !== token) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
        const accessToken = genJwtToken({ id: user._id });

        // Optionally: Generate a new refresh token (token rotation)
        const newRefreshToken = genJwtToken(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET_KEY,
            process.env.JWT_REFRESH_TOKEN_LIFE
        );
        user.refreshToken = newRefreshToken;
        await user.save();

        // Send both new tokens to the client
        res.status(200).json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.sendStatus(403).json({ message: 'Invalid or expired refresh token', error });
    }
};
// Logout Endpoint
export const logout = async (req, res) => {
    const { token } = req.body;
    try {
        const user = await UserModel.findOneAndUpdate({ refreshToken: token }, { refreshToken: '' });
        // const decoded = jwtVerifier(token, process.env.REFRESH_TOKEN_SECRET_KEY);
        // const user = await UserModel.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        // user.refreshToken = undefined;
        // await user.save();
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
