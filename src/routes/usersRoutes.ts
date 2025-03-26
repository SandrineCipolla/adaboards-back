
import express from "express";
import jwt from 'jsonwebtoken';
import {app, prisma} from "../app";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.password === password) {
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

module.exports = router;