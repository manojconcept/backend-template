import mongoose from "mongoose";
import { genHashedPassword, compareHasedPassword } from "../config/authentication.js";

const tokenSchema = new mongoose.Schema(
    {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User id is required']
        },
        logins: [{ _id: false, refreshtoken: { type: String, default: undefined }, accesstoken: { type: String, default: undefined }, refreshexp: { type: Date, default: undefined } }],
        password: { type: String, default: undefined },
        resettoken: { type: String, default: undefined },
        verificationtoken: { type: String, default: undefined }
    },
    {
        timestamps: true
    }
);

tokenSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await genHashedPassword(this.password);
    next();
})


tokenSchema.methods.comparePassword = function (password) {
    return compareHasedPassword(password, this.password);
}

const TokenModel = mongoose.model('Tokens', tokenSchema);
export default TokenModel;

