import 'dotenv/config';

export const PORT = Number(process.env.PORT || 5000);
export const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-me';
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
