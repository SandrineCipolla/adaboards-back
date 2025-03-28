import {PrismaClient} from '@prisma/client';
import jwt from "jsonwebtoken";

import type { PrismaClient as PrismaClientType } from "@prisma/client";

const JWT_SECRET = 'secret';

export class UserController {
    private prisma: PrismaClientType;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    public async userLogin(email:string, password:string) {

        if (!email || !password) {
            throw new Error ('Email and password are required');
        }

        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('User not found') ;
        }

        return jwt.sign({userId: user.id}, JWT_SECRET, {expiresIn: '1h'})

    }

    public async userRegister(fullname:string, email:string, password:string) {

        if(!fullname || !email || !password){
            throw new Error( 'Please fill all the fields');
        }
        await this.prisma.user.create({ data: { fullname, email, password} });

        return ({message: 'User created successfully'});
    }

}

