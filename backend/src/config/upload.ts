import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { Request } from 'express';
import dotenv from 'dotenv';

// 👇 TRUCO MAESTRO: Forzamos la ruta exacta del archivo .env
// __dirname es "src/config". Subimos dos niveles (../..) para llegar a "backend/.env"
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 1. Limpieza de variables
const region = (process.env.AWS_REGION || 'us-east-1').trim();
const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
const bucketName = (process.env.AWS_BUCKET_NAME || '').trim();

// 🔍 DIAGNÓSTICO: Esto saldrá en tu terminal negra al iniciar
console.log("------------------------------------------------");
console.log("🔧 CONFIGURANDO S3 (Ruta Forzada):");
console.log("📂 Buscando .env en:", path.resolve(__dirname, '../../.env'));
console.log("📍 Región:", region);
console.log("📦 Bucket:", bucketName);
// Mostramos los primeros 4 caracteres para verificar que leyó algo (sin mostrar el secreto completo)
console.log("🔑 Access Key:", accessKeyId ? accessKeyId.substring(0, 4) + "..." : "NO ENCONTRADA");
console.log("------------------------------------------------");

// 2. Configuración del Cliente AWS
const s3 = new S3Client({
    region: region,
    // Endpoint global para evitar problemas de redirección en us-east-1
    endpoint: 'https://s3.amazonaws.com',
    forcePathStyle: true,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    }
});

// 3. Configuración del Almacenamiento
export const uploadS3 = multer({
    storage: multerS3({
        s3: s3,
        bucket: bucketName,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req: Request, file: Express.Multer.File, cb: (error: any, metadata?: any) => void) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            cb(null, `uploads/${uniqueSuffix}${extension}`);
        }
    }),
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        cb(null, true);
    }
});