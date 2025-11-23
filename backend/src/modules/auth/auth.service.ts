import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const login = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            company: true, // Incluir datos de la empresa si es necesario
        },
    });

    if (!user) {
        throw new Error('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            companyName: user.company?.name,
        },
    };
};
