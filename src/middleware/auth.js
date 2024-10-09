import { jwtVerifier } from "../config/authentication.js";

export function auth(req, res, next) {
    try {
        // Get the Authorization header value
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw new Error("Authorization header not found");
        }

        // Start with Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Authorization header must start with 'Bearer '" });
        }

        // Extract the token part from the 'Bearer <token>' format
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new Error("Token not found in Authorization header");
        }

        // Verify the token
        jwtVerifier(token);

        // Proceed to the next middleware/route handler
        next();

    } catch (e) {
        // Send an error response if any issue occurs
        res.status(401).send({ message: e.message });
    }
}
