import sendMail from "../config/email.js";
import { genJwtToken, isJWTInvalid } from "../config/authentication.js";
import { findUser_WOC } from "../services/userServices.js";

import UserModel from "../models/Users.js";
import TokenModel from "../models/Tokens.js";

export const signup = async (req, res) => {
    const { email, username, password, phone } = req.body;
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

        res.status(201).json({ status: true, message: 'User created successfully, please verify your email.' });
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
        existingToken.resettoken = undefined;
        await existingToken.save();
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
        res.header("Set-Cookie", `username="john doe"; Max-Age=172800; Path=/; HttpOnly; Secure; SameSite=None;`);
        res.cookie('k-manoj', 'manoj', {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            maxAge: 10*24 * 60 * 60 * 1000,
        });
        if (!user.deleted) {
            const maxAge = 7 * 24 * 60 * 60 * 1000;
            const maxExp = Date.now() + maxAge;
            const isMatch = await existingToken.comparePassword(password);
            if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
            const accessToken = genJwtToken({ id: user._id });
            const refreshToken = genJwtToken(
                { id: user._id },
                process.env.REFRESH_TOKEN_SECRET_KEY,
                process.env.JWT_REFRESH_TOKEN_LIFE
            );
            const updatedTokenDoc = await TokenModel.findByIdAndUpdate(
                user._id,
                {
                    $push: { logins: { accesstoken: accessToken, refreshtoken: refreshToken, refreshexp: maxExp } }
                }, {
                new: true,
                upsert: true
            }
            );
            res.cookie('k-token', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "None",
                maxAge: 10*24 * 60 * 60 * 1000,
            });
            await user.save()
            return res.status(200).json({ accessToken, refreshToken });
        }
        res.status(200).json({ message: 'Invalid credentials' });

    } catch (error) {
        res.status(500).json({ message: 'Server ' + error });
    }
};
export const refreshToken = async (req, res) => {
    const cookieRefreshingToken = req.cookies['r-token'];
    if (!cookieRefreshingToken) return res.status(401).json({ loginStatus: false, message: 'Refresh token required' });
    try {
        const jwtStatus = isJWTInvalid(cookieRefreshingToken, process.env.REFRESH_TOKEN_SECRET_KEY);
        const existingUser = await UserModel.findOne({ _id: jwtStatus?.id, isVerified: true, deleted: false });
        const existingToken = await TokenModel.findOne({ _id: jwtStatus.id, 'logins.refreshtoken': cookieRefreshingToken }, { 'logins.$': 1 })
        if (!existingUser || jwtStatus?.status) {
            if (existingToken) {
                await TokenModel.findByIdAndUpdate(
                    jwtStatus?.id,
                    { $pull: { logins: { refreshtoken: cookieRefreshingToken } } }, // Removes the entire object where refreshtoken matches
                    { new: true } // Return updated document
                );
            }
            res.clearCookie('r-token', {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            })
            return res.status(400).json({ loginStatus: false });
        }

        if (!existingToken) {
            res.clearCookie('r-token', {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            })
            return res.status(400).json({ loginStatus: false });
        }


        const newRefreshToken = genJwtToken({ id: existingUser._id }, process.env.REFRESH_TOKEN_SECRET_KEY, process.env.JWT_REFRESH_TOKEN_LIFE);
        const newAccessToken = genJwtToken({ id: existingUser._id });

        const maxAge = 7 * 24 * 60 * 60 * 1000;
        const maxExp = Date.now() + maxAge;

        const updatedToken = await TokenModel.findByIdAndUpdate(
            jwtStatus?.id,
            {
                $set: {
                    'logins.$[elem].refreshtoken': newRefreshToken,   // Set the new refresh token
                    'logins.$[elem].accesstoken': newAccessToken,      // Set the new access token
                    'logins.$[elem].refreshexp': maxExp     // Set the new refresh token expiration date
                }
            },
            {
                new: true, // Return updated document
                arrayFilters: [{ 'elem.refreshtoken': cookieRefreshingToken }] // Ensure only the element with the matching refreshtoken is updated
            }
        );

        if (!updatedToken) {
            res.clearCookie('r-token', {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            });
            return res.status(400).json({ loginStatus: false })
        };

        res.cookie('r-token', newRefreshToken, {
            httpOnly: true,  // Cookie cannot be accessed via JavaScript
            secure: process.env.NODE_ENV === 'production',  // Only send over HTTPS in production
            sameSite: 'Strict',  // Prevents cross-site request forgery (CSRF)
            maxAge: maxAge // Cookie expires in 7 days
        });

        res.status(200).json({ refreshtoken: newRefreshToken, accesstoken: newAccessToken });
    } catch (error) {
        res.status(403).json({ message: 'Invalid or expired refresh token ' + error });
    }
};
export const requestPasswordReset = async (req, res) => {
    const { logname } = req.body;
    try {
        const existingUser = await findUser_WOC(logname);
        if (!existingUser || !existingUser.isVerified || !existingUser.deleted) return res.status(200).json({ message: 'User Password reset link sent to your email' });
        const resetToken = genJwtToken({ id: existingUser._id });
        await TokenModel({ resettoken: resetToken });
        await TokenModel.save();
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
export const verifyPasswordReset = async () => {
    try {
        const cookieRefreshingToken = req.cookies['r-token'];
        // if (cookieRefreshingToken) {
        //     res.clearCookie('r-token', {
        //         httpOnly: true,
        //         secure: true,
        //         sameSite: 'Strict'
        //     });
        // }
        // const { token } = req.params;
        // const { newPwd } = req.body;
        // const jwtStatus = isJWTInvalid(token, ACCESS_TOKEN_SECRET_KEY);
        // const existingUser = await UserModel.findOne({ _id: jwtStatus?.id, isVerified: true, deleted: false });
        // const existingToken = await TokenModel.findById(jwtStatus?.id);
        // if (jwtStatus?.status || !existingUser || !existingToken) return res.status(400).json({ message: 'Invalid User or Invalid Token or expired refresh token ' });
        // await TokenModel.findByIdAndUpdate(
        //     jwtStatus?.id,
        //     { $set: { password: newPwd } },
        //     { new: true }
        // );
        // existingToken.logins = [];
        // existingToken.resettoken = undefined;
        // await existingToken.save();
        res.status(200).json({ message: cookieRefreshingToken });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });

    }
}
export const resetPassword = async (req, res) => {
    try {
        const cookieRefreshingToken = req.cookies['r-token'];
        const { oldpwd, newPwd } = req.body;
        if (!cookieRefreshingToken) return res.status(401).json({ loginStatus: false, message: 'Refresh token required' });
        const jwtStatus = isJWTInvalid(cookieRefreshingToken, process.env.REFRESH_TOKEN_SECRET_KEY);
        const existingToken = await TokenModel.findOne({ _id: jwtStatus.id, 'logins.refreshtoken': cookieRefreshingToken }, { 'logins.$': 1 })
        const existingUser = await UserModel.findOne({ _id: jwtStatus?.id, isVerified: true, deleted: false });
        if (!existingUser || jwtStatus?.status) {
            if (existingToken) {
                await TokenModel.findByIdAndUpdate(
                    jwtStatus?.id,
                    { $pull: { logins: { refreshtoken: cookieRefreshingToken } } },
                    { new: true }
                );
            }
            res.clearCookie('r-token', {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            })
            return res.status(400).json({ loginStatus: false });
        }

        if (!existingToken) {
            res.clearCookie('r-token', {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            })
            return res.status(400).json({ loginStatus: false });
        }

        const isMatch = await existingToken.comparePassword(oldpwd);
        if (!isMatch) return res.status(400).json({ message: 'old password inValid ' });

        await TokenModel.findByIdAndUpdate(
            jwtStatus?.id,
            { $set: { password: newPwd } },
            { new: true }
        );
        existingToken.logins = [];
        await existingToken.save();
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
export const logOut = async (req, res) => {
    const cookieRefreshingToken = req.cookies['r-token'];
    if (!cookieRefreshingToken) return res.status(401).json({ loginStatus: false, message: 'Refresh token required' });
    try {
        const jwtStatus = isJWTInvalid(cookieRefreshingToken, process.env.REFRESH_TOKEN_SECRET_KEY);
        const existingToken = await TokenModel.findOne({ _id: jwtStatus.id, 'logins.refreshtoken': cookieRefreshingToken }, { 'logins.$': 1 })
        if (existingToken) {
            await TokenModel.findByIdAndUpdate(
                jwtStatus?.id,
                { $pull: { logins: { refreshtoken: cookieRefreshingToken } } },
                { new: true }
            );

            res.clearCookie('r-token', {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            })
            return res.status(200).json({ loginStatus: false });
        }


        res.clearCookie('r-token', {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict'
        })
        res.status(200).json({ loginStatus: false });

    } catch (e) {
        res.status(403).json({ message: 'server Error' + e });

    }
};
export const logOutAll = async (req, res) => {
    const cookieRefreshingToken = req.cookies['r-token'];
    try {
        const jwtStatus = isJWTInvalid(cookieRefreshingToken, process.env.REFRESH_TOKEN_SECRET_KEY);
        const existingToken = await TokenModel.findOne({ _id: jwtStatus.id, 'logins.refreshtoken': cookieRefreshingToken }, { 'logins.$': 1 })
        if (existingToken) {
            await TokenModel.findByIdAndUpdate(
                jwtStatus?.id,
                { $set: { logins: [] } },
                { new: true }
            );

            res.clearCookie('r-token', {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            })
            return res.status(200).json({ loginStatus: false });
        }

        res.clearCookie('r-token', {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict'
        })
        res.status(200).json({ loginStatus: false });
    } catch (e) {
        res.status(403).json({ message: 'server Error' + e });
    }
}
