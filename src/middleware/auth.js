import { jwtVerifier } from "../config/authentication.js";

export function auth(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw new Error("Authorization header not found");
        }
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Authorization header must start with 'Bearer'" });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new Error("Token not found in Authorization header");
        }
        jwtVerifier(token); //which default set to accesstoken
        next();
    } catch (e) {
        res.status(401).send({ message: e.message });
    }
}
