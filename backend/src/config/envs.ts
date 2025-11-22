import dotenv from 'dotenv';

dotenv.config();

export const envs = {
    PORT: process.env.PORT || 3000,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV || 'development',
};

// Validación simple
if (!envs.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env');
}
