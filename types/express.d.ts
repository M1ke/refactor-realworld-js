// Ambient module augmentation: shared across middleware and controllers
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userEmail?: string;
            userHashedPwd?: string;
            loggedin?: boolean;
        }
    }
}

export {};
