import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

declare global {
    namespace Express {
        interface Request {
            loggedin?: boolean;
            userId?: string;
            userEmail?: string;
            userHashedPwd?: string;
        }
    }
}

const verifyJWTOptional = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization || (req.headers.Authorization as string | undefined);

    if (!authHeader || !authHeader?.startsWith('Token ') || !authHeader.split(' ')[1].length) {
        req.loggedin = false;
        next();
        return;
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string,
        (err, decoded) => {
            if (err) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }
            const payload = decoded as jwt.JwtPayload;
            req.loggedin = true;
            req.userId = payload.user.id;
            req.userEmail = payload.user.email;
            req.userHashedPwd = payload.user.password;
            next();
        }
    );
};

module.exports = verifyJWTOptional;
