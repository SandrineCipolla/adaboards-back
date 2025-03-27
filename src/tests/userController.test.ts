

import { UserController } from "../controllers/userController";
import { PrismaClient } from "@prisma/client"



jest.mock("@prisma/client", () => {
    return {
        PrismaClient: jest.fn().mockImplementation(() => ({
            user: {
                create: jest.fn(),
                findUnique: jest.fn(),
            },
            $disconnect: jest.fn(),
        }
        )),
    };
});

const prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const userController = new UserController(prisma);

describe("UserController", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("devrait créer un utilisateur", async () => {
        const mockUser = { id: 1, fullname: "Toto", email: "test@example.com", password: "Test" };
        (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

        const user = await userController.userRegister("Toto", "test@example.com", "Test");

        expect(user).toEqual({ message: 'User created successfully' });
        expect(prisma.user.create).toHaveBeenCalledWith({
            data: { fullname: "Toto", email: "test@example.com", password: "Test" },
        });
    });

    it("devrait récupérer la liste des utilisateurs", async () => {
        const mockUsers = [
            { id: 1, fullname:"Toto",email: "test@example.com", password: "Test" },
            { id: 2, fullname:"User",email: "user@example.com", name: "123" },
        ];

        (prisma.user.findUnique as jest.Mock).mockImplementation(({ where: { email } }) => {
            return mockUsers.find(user => user.email === email);
        });

        const token = await userController.userLogin("test@example.com", "Test");

        expect(token).toEqual(expect.any(String));
        expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
    });

});