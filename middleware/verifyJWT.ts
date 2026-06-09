import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

interface JwtUserPayload {
    user: {
        id: string;
        email: string;
        password: string;
    };
}

const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = (req.headers.authorization || req.headers.Authorization) as string | undefined;

    if (!authHeader?.startsWith('Token ')) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string,
        (err: jwt.JsonWebTokenError | null, decoded: string | jwt.JwtPayload | undefined) => {
            if (err) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            const payload = decoded as JwtUserPayload;
            req.userId = payload.user.id;
            req.userEmail = payload.user.email;
            req.userHashedPwd = payload.user.password;
            next();
        }
    )
};

export = verifyJWT;
