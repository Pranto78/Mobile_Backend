import { env } from "./config/env";
import { connectDB } from "./config/db";
import app from "./app";

async function startServer() {
  try {
    await connectDB();

    app.listen(Number(env.port), "0.0.0.0", () => {
  console.log(`Server running on port ${env.port}`);
});
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();