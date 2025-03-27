
import express from "express";

import jwt from 'jsonwebtoken';
import {app, prisma} from "../app";
import {Role, Column} from "@prisma/client";

const router = express.Router();
const JWT_SECRET = 'secret';
import bcrypt from 'bcryptjs';

declare module 'express' {
    interface Request {
        user?: any;
    }
}


// const password = "test";
// const hashedPassword = "$2b$10$GPSLEbbyb6FCO8kesEfKReQNo6V3f1maAhAOk9laFF3IE.wHOTFG2";
//
// bcrypt.compare(password, hashedPassword, (err, result) => {
//     console.log("Mot de passe valide ?", result); // Doit afficher true si tout est OK
// });

//Middleware
const authenticationMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction):any => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send('Unauthorized');
    jwt.verify(token, JWT_SECRET, (err,user) => {
        console.log(err)
        if (err) return res.status(403).send('Forbidden');
        req.user = user;
        next();
    });
};


//Connexion
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && password === user.password) {
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        console.log("Invalid credentials response sent");
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

//Register
app.post('/api/auth/register', async (req, res) => {
    const {fullname, email, password} = req.body;

    if(!fullname || !email || !password){
        res.status(400).json({error: 'Please fill all the fields'});
    }

    // const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { fullname, email, password} });

    res.status(201).json({message: 'User created successfully'});
});


//Routes protégées
app.get('/api/protected', authenticationMiddleware, async (req: express.Request, res: express.Response) => {
    const user = await prisma.user.findUnique({where: {id: req.user.userId}});
    res.json({message: `Hello ${user?.fullname}`});
})

app.get('/api/boards', authenticationMiddleware, async (req: express.Request, res: express.Response) => {
    const userId = req.user.userId;
    const boards = await prisma.board.findMany({
        where: {User_Board: {
                some: {
                    userId: userId
                }
            }
        }
    });
    res.json(boards);
});

app.post('/api/boards', authenticationMiddleware, async (req: express.Request, res: express.Response) => {
        const userId = req.user.userId;
        const role=Role.OWNER
        const { title } = req.body;

        if (!title) {
            res.status(400).json({ error: 'Board title is required' });
        }
        const newBoard = await prisma.board.create({
            data: {
                title,
                User_Board: {
                    create: {
                       userId,
                        role
                    }
                }
            },
            include: {
                User_Board: true
            }
        });
        res.status(201).json(newBoard);
});

app.post('api/boards/:boardId/tasks',authenticationMiddleware,async (req: express.Request, res: express.Response) => {
        const boardId=req.params.boardId;
        // const column =Column.TODO

        const {title}=req.body;

    if (!title) {
        res.status(400).json({ error: 'Task title is required' });
    }

    const boardExists = await prisma.board.findUnique({
        where: { id: Number(boardId) }
    });

    if (!boardExists) {
        res.status(404).json({ error: 'Board not found' });
    }


    const newTask = await prisma.task.create({
        data: {
            title,
            // column,
            board :{
                connect:{
                    id:Number(boardId)
                }
            }
        },
        include: {
            board:true
        }
    });
    res.status(201).json(newTask);
} )


module.exports = router;