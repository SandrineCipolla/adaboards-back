import express, { Request, Response } from 'express';
import {PrismaClient} from '@prisma/client';


const app = express();
const port = process.env.PORT || 3000;

const prisma = new PrismaClient()


app.get('/', async (req: Request, res: Response) => {
    const result = await prisma.test.findMany()
    res.json(result);
});

app.use(express.json());
app.use("/api", require("./routes/usersRoutes"));

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


export { app, prisma };