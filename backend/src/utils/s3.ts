import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// 1. Inicializamos el Cliente S3 (Las credenciales las toma de tu .env automáticamente)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'vitam-storage-weirchile-2025';

// 2. Función para subir archivos
export const uploadFileToS3 = async (fileBuffer: Buffer, fileName: string, mimeType: string) => {
  // Limpiamos el nombre para que no tenga espacios raros (ej: "foto perfil.jpg" -> "foto-perfil.jpg")
  const cleanName = fileName.replace(/\s+/g, '-').toLowerCase();
  
  // Le ponemos la fecha para que sea único (timestamp)
  const fileKey = `odi-documents/${Date.now()}-${cleanName}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileKey,     // El nombre final en la nube
    Body: fileBuffer, // El archivo en sí
    ContentType: mimeType,
  };

  try {
    // Enviamos el comando a AWS
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    // Construimos la URL pública
    // (Esto asume que el bucket es público o usaremos esto internamente)
    const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
    
    return { key: fileKey, url: publicUrl };
  } catch (error) {
    console.error('Error subiendo a S3:', error);
    throw new Error('Fallo al subir archivo a S3');
  }
};

// 3. Función para borrar archivos (por si acaso)
export const deleteFileFromS3 = async (fileKey: string) => {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    }));
    return true;
  } catch (error) {
    console.error('Error borrando de S3:', error);
    return false;
  }
};