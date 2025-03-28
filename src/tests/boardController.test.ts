import { BoardController } from "../controllers/boardController";
import { PrismaClient, Role } from "@prisma/client";


jest.mock("@prisma/client", () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            board: {
                findMany: jest.fn(),
                create: jest.fn(),
                findUnique: jest.fn(),
            },
            task: {
                create: jest.fn(),
            },
            $disconnect: jest.fn(),
        })),
        Role: { OWNER: "OWNER" },
    };
});

const prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const boardController = new BoardController(prisma);

describe("BoardController", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getBoards", () => {

        describe('when the connected user has boards', () => {
            it("should return the list of boards", async () => {
                const mockBoards = [
                    { id: 1, title: "Board 1" },
                    { id: 2, title: "Board 2" },
                ];

                (prisma.board.findMany as jest.Mock).mockResolvedValue(mockBoards);

                const boards = await boardController.getBoards(1);

                expect(boards).toEqual(mockBoards);
                expect(prisma.board.findMany).toHaveBeenCalledWith({
                    where: {
                        User_Board: {
                            some: { userId: 1 },
                        },
                    },
                });
            });
        })


        describe('when the connected user has no boards', () => {
            it("should return an empty array", async () => {
                (prisma.board.findMany as jest.Mock).mockResolvedValue([]);

                const boards = await boardController.getBoards(2);

                expect(boards).toEqual([]);
                expect(prisma.board.findMany).toHaveBeenCalledWith({
                    where: {
                        User_Board: {
                            some: { userId: 2 },
                        },
                    },
                });
            });
        })

    });

    describe("createBoards", () => {

        describe('when a board is created', () => {
            it('should be assigned to a user',async () => {
                const mockBoard = {
                    id: 1,
                    title: "New Board",
                    User_Board: [{ userId: 1, role: Role.OWNER }],
                };

                (prisma.board.create as jest.Mock).mockResolvedValue(mockBoard);

                const board = await boardController.createBoards("New Board", 1);

                expect(board).toEqual(mockBoard);
                expect(prisma.board.create).toHaveBeenCalledWith({
                    data: {
                        title: "New Board",
                        User_Board: {
                            create: {
                                userId: 1,
                                role: Role.OWNER,
                            },
                        },
                    },
                    include: { User_Board: true },
                });
            });
        })

        describe('when the board title is empty', () => {
            it('should throw an error', async () => {
                await expect(boardController.createBoards("", 1)).rejects.toThrow("Board title is required");
            });
        })

    });

});
