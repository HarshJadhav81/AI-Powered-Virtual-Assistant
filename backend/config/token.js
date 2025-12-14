import jwt from "jsonwebtoken";

const genToken = async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required to generate token');
        }

        const token = jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d", // Reduced to 7 days for security
                algorithm: "HS256", // Explicitly specify the algorithm
                issuer: "ai-virtual-assistant", // Add issuer
                audience: "user-auth" // Add audience
            }
        );

        return token;
    } catch (error) {
        console.error('Token generation error:', error);
        throw new Error('Failed to generate authentication token');
    }
}

export default genToken