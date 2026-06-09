import express, { Router } from 'express';
import * as path from 'path';

const router: Router = express.Router();

router.get('^/$|/index(.html)?', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

export = router;
