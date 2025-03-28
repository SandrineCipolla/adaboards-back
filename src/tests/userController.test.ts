

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

    describe("userRegister", () => {

        describe('when the user gives all the required fields', () => {
            it("should create an new user", async () => {
                const mockUser = { id: 1, fullname: "Toto", email: "test@example.com", password: "Test" };
                (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

                const user = await userController.userRegister("Toto", "test@example.com", "Test");

                expect(user).toEqual({ message: 'User created successfully' });
                expect(prisma.user.create).toHaveBeenCalledWith({
                    data: { fullname: "Toto", email: "test@example.com", password: "Test" },
                });
            });
        })

        describe('when the user does not give all the required fields', () => {
            it("should return a error message", async () => {
                await expect(userController.userRegister("", "test@example.com", "Test"))
                    .rejects.toThrow("Please fill all the fields");

                await expect(userController.userRegister("Toto", "", "Test"))
                    .rejects.toThrow("Please fill all the fields");

                await expect(userController.userRegister("Toto", "test@example.com", ""))
                    .rejects.toThrow("Please fill all the fields");
            });
        })
    })


    describe('userLogin', () => {

        describe('when the user gives all the required fields', () => {
            it("should return a valid token", async () => {
                const mockUser = { id: 1, fullname: "Toto", email: "test@example.com", password: "Test" };
                (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

                const token = await userController.userLogin("test@example.com", "Test");

                expect(token).toEqual(expect.any(String));
                expect(token.length).toBeGreaterThan(0);

                expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
            });
        })

        describe('when the email is missing', () => {
            it("should return a error message and the connection should failed", async () => {
                await expect(userController.userLogin("", "Test"))
                    .rejects.toThrow("Email and password are required");
            });
        })

        describe('when the password is missing', () => {
            it("should return a error message and the connection should failed", async () => {
                await expect(userController.userLogin("test@example.com", ""))
                    .rejects.toThrow("Email and password are required");
            });
        })

        describe('when the user does not exist', () => {
            it("should return a error message and the connection should failed", async () => {
                (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

                await expect(userController.userLogin("unknown@example.com", "password"))
                    .rejects.toThrow("User not found");
            });
        })
    })

});