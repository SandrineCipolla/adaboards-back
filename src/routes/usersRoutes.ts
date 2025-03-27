
import express from "express";

import jwt from 'jsonwebtoken';
import {app, prisma} from "../app";
import {Role, Column} from "@prisma/client";

const router = express.Router();
const JWT_SECRET = 'secret';
import bcrypt from 'bcryptjs';
import {UserController} from "../controllers/userController";
import {BoardController} from "../controllers/boardController";

declare module 'express' {
    interface Request {
        user?: any;
    }
}

const userController = new UserController();
const boardController= new BoardController();

// const password = "test";
// const hashedPassword = "$2b$10$GPSLEbbyb6FCO8kesEfKReQNo6V3f1maAhAOk9laFF3IE.wHOTFG2";
//
// bcrypt.compare(password, hashedPassword, (err, result) => {
//     console.log("Mot de passe valide ?", result); // Doit afficher true si tout est OK
// });

//Middleware
const authenticationMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction):any => {
    console.log('Authenticating user...');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.log('No token found');
        return res.status(401).send('Unauthorized');
    }
    // jwt.verify(token, JWT_SECRET, (err,user) => {
    //     console.log(err)
    //     if (err) return res.status(403).send('Forbidden');
    //     req.user = user;
    //     next();
    // });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Token is valid', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.log('Invalid token', err);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};


//Connexion
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await userController.userLogin(email, password);
        res.json({ token });
    } catch (error ) {
        const err = error as Error
        res.status(400).json({ error: err.message });
    }
});

//Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        const registredUser = await userController.userRegister(fullname, email, password);
        res.status(201).json(registredUser);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});


//Routes protégées
app.get('/api/protected', authenticationMiddleware, async (req: express.Request, res: express.Response) => {
    const user = await prisma.user.findUnique({where: {id: req.user.userId}});
    res.json({message: `Hello ${user?.fullname}`});
})

app.get('/api/boards', authenticationMiddleware, async (req: express.Request, res: express.Response) => {
    try {
        const userId = req.user.userId;
        const boards = await boardController.getBoards(userId);
        res.json(boards);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});

app.post('/api/boards', authenticationMiddleware, async (req: express.Request, res: express.Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
        }

        const { title } = req.body;

        const newBoard = await boardController.createBoards(title, userId);
        res.status(201).json(newBoard);

    } catch (error) {

        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }

});

app.post('api/boards/:boardId/tasks',authenticationMiddleware,async (req: express.Request, res: express.Response) => {
//     app.post('/api/boards/:boardId/tasks', async (req: express.Request, res: express.Response) => {
    console.log('POST /api/boards/:boardId/tasks called');
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
        }
        const boardId = Number(req.params.boardId);
        console.log('boardId:', boardId);

        if (isNaN(boardId)) {
            res.status(400).json({ error: 'Invalid board ID' });
        }

        const { title } = req.body;
        console.log('title:', title);

        const newTask = await boardController.createTasks(title, Number(boardId));
        console.log('newTask:', newTask);
        res.status(201).json(newTask);

    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred' });
        }
    }
});


module.exports = router;