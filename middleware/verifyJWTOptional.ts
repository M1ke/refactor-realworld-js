import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { isJwtUserPayload } from '../types/jwt';

const verifyJWTOptional = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;

    if (!authHeader || !authHeader.startsWith('Token ') || !authHeader.split(' ')[1].length) {
        req.loggedin = false;
        next();
        return;
    }

    const token = authHeader.split(' ')[1];

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
        res.status(500).json({ message: 'Server misconfiguration: missing ACCESS_TOKEN_SECRET' });
        return;
    }

    jwt.verify(
        token,
        secret,
        (err, decoded) => {
            if (err) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }

            if (!isJwtUserPayload(decoded)) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }

            req.loggedin = true;
            req.userId = decoded.user.id;
            req.userEmail = decoded.user.email;
            req.userHashedPwd = decoded.user.password;
            next();
        }
    );
};

export default verifyJWTOptional;