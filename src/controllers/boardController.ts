import {PrismaClient, type PrismaClient as PrismaClientType, Role} from "@prisma/client";


export class BoardController {
    private prisma: PrismaClientType;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    public async getBoards (userId:number){
        return await this.prisma.board.findMany({
            where: {
                User_Board: {
                    some: {userId},
                },
            },
        });
    }

    public async createBoards (title:string,userId:number){

        if (!title) {
            throw new Error( 'Board title is required');
        }
        return await this.prisma.board.create({
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

        const boardExists = await this.prisma.board.findUnique({
            where: { id: Number(boardId) }
        });

        if (!boardExists) {
            throw new Error( 'Board not found' );
        }

        return await this.prisma.task.create({
            data: {
                title,
                boardId,
            }
        })
    }
}