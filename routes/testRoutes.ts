import express, { Router } from 'express';

const router: Router = express.Router();

router.get('/', (req, res) => {
    console.log("successful!");
    res.status(200);
    res.json({ message: 'successful' });
});

export = router;
