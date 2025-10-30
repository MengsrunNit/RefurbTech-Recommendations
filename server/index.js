import express from "express";
import cors from "cors";
import PhoneRouter from "./routes/PhoneRouter.js";
import ChatRouter from "./routes/ChatRouter.js";
import { config as dotenvConfig } from "dotenv";
// Load .env and override any existing env var (helps when a stale OPENAI_API_KEY is exported in shell)
dotenvConfig({ override: true });

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api", PhoneRouter);
app.use("/api", ChatRouter);

// Error handler to return JSON (helps debugging in frontend)
app.use((err, req, res, next) => {
  console.error(err);
  const payload = { error: "Internal Server Error" };
  // In development, surface the actual error message to help debugging
  if (process.env.NODE_ENV !== "production") {
    payload.message = err.message;
    payload.stack = err.stack;
  }
  res.status(500).json(payload);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
