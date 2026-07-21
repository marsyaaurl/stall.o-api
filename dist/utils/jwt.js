import jwt from "jsonwebtoken";
export const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured in environment variables.");
    }
    const expiresIn = (process.env.JWT_EXPIRES_IN || "7d");
    const options = { expiresIn };
    return jwt.sign(payload, secret, options);
};
export const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured in environment variables.");
    }
    return jwt.verify(token, secret);
};
