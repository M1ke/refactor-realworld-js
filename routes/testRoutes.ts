import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    console.log("successful!");
    res.status(200);
    res.json({ message: 'successful' });
});

export default router;