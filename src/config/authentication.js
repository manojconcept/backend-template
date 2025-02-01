import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { ACCESS_TOKEN_SECRET_KEY, JWT_ACCESS_TOKEN_LIFE } = process.env;

export async function genHashedPassword(pwd, rounds = 10) {
    try {
        const salt = await bcrypt.genSalt(rounds);
        const genHashed = await bcrypt.hash(pwd, salt);
        console.log("Generated Hashed Password");
        return genHashed;

    } catch (e) {
        console.error("Error generating hashed password", e);
        throw error;
    }
}
export async function compareHasedPassword(pwd, storedPwd) {
    try {
        const compare = await bcrypt.compare(pwd, storedPwd);
        console.log("compared Hashed Password");
        return compare;
    } catch (e) {
        console.log("Error comparing hashed password", e);
        throw error;
    }
}
export const genJwtToken = (uniqueObj, SECRET_KEY = ACCESS_TOKEN_SECRET_KEY, expiresIn = JWT_ACCESS_TOKEN_LIFE) => { jwt.sign(uniqueObj, SECRET_KEY, { expiresIn }) };
export const jwtVerifier = (token, SECRET_KEY = ACCESS_TOKEN_SECRET_KEY) => jwt.verify(token, SECRET_KEY);
export const jwtDecoder = token => jwt.decode(token);
export function isJWTExpired(token, SECRET_KEY) {
    try {
        const jwtv = jwtVerifier(token, SECRET_KEY);
        return {
            status: false,
            ...jwtv
        };
    } catch (e) {
        if (e.name === "TokenExpiredError") {
            return {
                status: true,
                ...jwtDecoder(token)
            };
        }
        return { [e.name]: e.message };
    }
}