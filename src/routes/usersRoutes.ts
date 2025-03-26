
import express from "express";

import jwt from 'jsonwebtoken';
import {app, prisma} from "../app";

const router = express.Router();
const JWT_SECRET = 'secret';
import bcrypt from 'bcryptjs';

declare module 'express' {
    interface Request {
        user?: any;
    }
}

//Middleware
const authenticationMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction):any => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).send('Unauthorized');
    jwt.verify(token, JWT_SECRET, (err,user) => {
        if (err) return res.status(403).send('Forbidden');
        req.user = user;
        next();
    });
};


//Connexion
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

//Register
app.post('/api/auth/register', async (req, res) => {
    const {fullname, email, password} = req.body;

    if(!fullname || !email || !password){
        res.status(400).json({error: 'Please fill all the fields'});
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { fullname, email, password } });

    res.status(201).json({message: 'User created successfully'});
});

//Routes protégées
app.get('api/protected', authenticationMiddleware, (req: express.Request, res: express.Response) => {
 res.json({message: `Hello ${req.user.userId}`});
})

module.exports = router;