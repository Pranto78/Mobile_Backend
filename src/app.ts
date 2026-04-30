import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({
    message: "Team Report Manager API is running",
  });
});

app.use("/api/auth", authRoutes);


app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});


export default app;