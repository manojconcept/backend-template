import sendMail from "../config/email.js";
import { genJwtToken, jwtVerifier, jwtDecoder, isJWTExpired } from "../config/authentication.js";
import { findUser_WOC } from "../services/userServices.js";

import UserModel from "../models/Users.js";
import TokenModel from "../models/Tokens.js";

export const signup = async (req, res) => {
    const { email, username, password, phone } = req.body;
    console.log(password);

    try {
        const existingUser = await UserModel.findOne({ email });
        const existingUserName = await UserModel.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });
        if (existingUserName) return res.status(400).json({ message: 'Username already exists' });
        const newUser = new UserModel({ email, username, phone });
        const savedUser = await newUser.save();
        const verificationToken = genJwtToken({ id: savedUser._id });
        const newTokenLog = new TokenModel({ _id: savedUser._id, verificationtoken: verificationToken, password });
        await savedUser.save();
        const createdNewToken = await newTokenLog.save();
        const verificationUrl = `http://localhost:3300/auth/verify/${verificationToken}`;
        await sendMail({
            to: email,
            subject: 'Verify your email',
            text: `Please verify your email by clicking this link: ${verificationUrl}`
        })

        res.status(201).json({ message: 'User created successfully, please verify your email.' });
    } catch (error) {
        res.status(500).json({ message: `server ${error}` });
    }
};
export const verifyEmail = async (req, res) => {
    const { token } = req.params;
    try {
        const decoded = jwtDecoder(token);
        const user = await UserModel.findById(decoded.id);
        const existingToken = await TokenModel.findById(decoded.id);
        if (!user || !existingToken || !existingToken.verificationtoken || existingToken.verificationtoken !== token || !(Date.now() > decoded.exp)) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        user.isVerified = true;
        existingToken.verificationtoken = undefined;
        await user.save();
        await existingToken.save();
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
export const login = async (req, res) => {
    const { logname, password } = req.body;
    try {
        const user = await findUser_WOC(logname);
        const existingToken = await TokenModel.findById(user._id);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (!user.isVerified) {
            const jwtDecoded = jwtDecoder(existingToken?.verificationtoken);
            if (!existingToken.verificationtoken || Date.now() > jwtDecoded?.exp) {
                const newVerificationToken = genJwtToken({ id: user._id });
                existingToken.verificationtoken = newVerificationToken;
                await existingToken.save();
                const verificationUrl = `http://localhost:3300/auth/verify/${newVerificationToken}`;
                await sendMail({
                    to: user.email,
                    subject: 'Verify your email (Reverification)',
                    text: `Please verify your email by clicking this link: ${verificationUrl}`
                });
                return res.status(200).json({ message: 'Verification email expired. A new verification email has been sent to your inbox.' });
            }
            return res.status(200).json({ message: 'User not verified. Please check your email for verification.' });
        }
        if (!user.deleted) {
            const isMatch = await existingToken.comparePassword(password);
            if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
            const accessToken = genJwtToken({ id: user._id });
            const refreshToken = genJwtToken(
                { id: user._id },
                process.env.REFRESH_TOKEN_SECRET_KEY,
                process.env.JWT_REFRESH_TOKEN_LIFE
            );

            console.log(isJWTExpired(refreshToken,process.env.REFRESH_TOKEN_SECRET_KEY));
            const updatedTokenDoc = await TokenModel.findByIdAndUpdate(
                user._id,
                {
                    $push: { logins: { accesstoken: accessToken, refreshtoken: refreshToken } }
                }, {
                new: true,
                upsert: true
            }
            );
            await user.save()
            return res.status(200).json({ accessToken, refreshToken });
        }
        res.status(200).json({ message: 'Invalid credentials' });

    } catch (error) {
        res.status(500).json({ message: 'Server '+error });
    }
};
export const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await UserModel.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });
        const resetToken = genJwtToken({ id: user._id });
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
        await user.save();
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
export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwtVerifier(token);
        const user = await UserModel.findById(decoded.id);
        if (!user || !user.resetToken || user.resetToken !== token || Date.now() > user.resetTokenExpiry) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        user.password = newPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
export const refreshToken = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: 'Refresh token required' });
    try {
        const decoded = jwtVerifier(token, process.env.REFRESH_TOKEN_SECRET_KEY);
        const user = await UserModel.findById(decoded.id);
        if (!user) return res.sendStatus(403).json({ status: false, message: 'Invalid refresh token' });
        if (user.refreshToken !== token) {
            return res.status(403).json({ status: false, message: 'Invalid refresh token' });
        }
        const accessToken = genJwtToken({ id: user._id });

        const newRefreshToken = genJwtToken(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET_KEY,
            process.env.JWT_REFRESH_TOKEN_LIFE
        );
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({ status: true, accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.sendStatus(403).json({ message: 'Invalid or expired refresh token', error });
    }
};
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

