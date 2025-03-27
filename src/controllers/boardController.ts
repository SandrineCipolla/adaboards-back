import {prisma} from "../app";
import {Role} from "@prisma/client";

export class BoardController {

    public async getBoards (userId:number){
        return await prisma.board.findMany({
            where: {
                User_Board: {
                    some: {
                        userId: userId
                    }
                }
            }
        })
    }

    public async createBoards (title:string,userId:number){

        if (!title) {
            throw new Error( 'Board title is required');
        }
        return await prisma.board.create({
            data: {
                title,
                User_Board: {
                    create: {
                        userId,
                        role:Role.OWNER
                    }
                }
            },
            include: {
                User_Board: true
            }
        });
    }

    public async createTasks (title:string,boardId:number){
        if (!title) {
            throw new Error( 'Task title is required');
        }

        const boardExists = await prisma.board.findUnique({
            where: { id: Number(boardId) }
        });

        if (!boardExists) {
            throw new Error( 'Board not found' );
        }

        return await prisma.task.create({
            data: {
                title,
                boardId,
            }
        })
    }
}