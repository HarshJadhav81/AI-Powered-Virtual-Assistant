import jwt from "jsonwebtoken"
const isAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please login."
            });
        }

        const verifyToken = jwt.verify(token, process.env.JWT_SECRET);
        if (!verifyToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        req.userId = verifyToken.userId;
        next();
    } catch (error) {
        console.error('Auth Error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Invalid token format"
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Token has expired"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Authentication error occurred"
        });
    }
}

export default isAuth