import { jwtVerifier } from "../config/authentication.js";

export default function auth(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: Missing or invalid Authorization header" });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: Token missing" });
        }
        try {
            const decoded = jwtVerifier(token);
            req.clientUserData = decoded?.id; 
            next(); 
        } catch (error) {
           
            const errorResponse = {
                "JsonWebTokenError": { status: 403, message: "Invalid token" },
                "TokenExpiredError": { status: 401, message: "Access token expired", code: "TOKEN_EXPIRED" },
            }[error.name] || { status: 500, message: "Internal Server Error" };

            return res.status(errorResponse.status).json({ error: errorResponse.message, code: errorResponse.code });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
