import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: [frontendUrl, "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json());

export default app;
