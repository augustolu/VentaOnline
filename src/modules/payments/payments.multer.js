import multer from 'multer';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'node:fs';

// ---------------------------------------------------------------------------
// Directorio base de uploads locales
// Puede reemplazarse por un adaptador de S3 sin tocar el controlador.
// ---------------------------------------------------------------------------
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.resolve('uploads', 'receipts');

// Crea el directorio si no existe (útil en entornos sin volumen persistente configurado)
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// ALMACENAMIENTO LOCAL  ⟶  simulación de S3
//
// Para conectar S3 real, reemplaza diskStorage por multer-s3:
//
//   import multerS3 from 'multer-s3';
//   import { S3Client } from '@aws-sdk/client-s3';
//
//   const s3 = new S3Client({ region: process.env.AWS_REGION });
//   const storage = multerS3({ s3, bucket: process.env.S3_BUCKET, ... });
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),

    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `receipt-${uuidv4()}${ext}`;
        cb(null, uniqueName);
    },
});

/**
 * Tipos MIME aceptados para comprobantes de pago.
 * Solo imágenes JPG/PNG y documentos PDF.
 */
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'application/pdf',
]);

const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new multer.MulterError(
                'LIMIT_UNEXPECTED_FILE',
                'Solo se permiten imágenes (JPG, PNG) y documentos PDF.'
            ),
            false
        );
    }
};

/**
 * Middleware Multer preconfigurado para el campo "receipt".
 *
 * Uso: `upload.single('receipt')` en la ruta de upload-receipt.
 *
 * Límites:
 *  - Tamaño máximo: 5 MB
 *  - Tipos: JPG, PNG, PDF
 */
export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/**
 * Construye la URL pública del comprobante a guardar en la BD.
 *
 * LOCAL:  http://localhost:<PORT>/uploads/receipts/<filename>
 * S3:     la URL la retorna multer-s3 directamente en req.file.location
 *
 * @param {import('multer').File} file
 * @returns {string}
 */
export function buildReceiptUrl(file) {
    // Si usas multer-s3, accede a file.location directamente.
    if (file.location) return file.location;

    const port = process.env.PORT ?? 3000;
    const base = process.env.APP_BASE_URL ?? `http://localhost:${port}`;
    return `${base}/uploads/receipts/${file.filename}`;
}
