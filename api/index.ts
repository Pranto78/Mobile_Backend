import app from "../src/app";
import { connectDB } from "../src/config/db";

let dbPromise: Promise<void> | null = null;

async function ensureDB() {
  if (!dbPromise) {
    dbPromise = connectDB().then(() => undefined);
  }

  try {
    await dbPromise;
  } catch (error) {
    dbPromise = null;
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  await ensureDB();
  return app(req, res);
}