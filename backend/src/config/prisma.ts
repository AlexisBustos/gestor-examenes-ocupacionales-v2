import { PrismaClient } from '@prisma/client';
import { envs } from './envs';

declare global {
    var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (envs.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
