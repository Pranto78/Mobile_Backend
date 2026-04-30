import { env } from "./config/env";
import { connectDB } from "./config/db";
import app from "./app";

async function startServer() {
  await connectDB();

  app.listen(Number(env.port), () => {
    console.log(`Server running on port ${env.port}`);
  });
}

startServer();