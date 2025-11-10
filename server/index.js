import express from "express";
import cors from "cors";
import PhoneRouter from "./routes/PhoneRouter.js";
import ChatRouter from "./routes/ChatRouter.js";
import PixelRouter from "./routes/PixelRoutes.js";
import { config as dotenvConfig } from "dotenv";
// Load .env and override any existing env var (helps when a stale OPENAI_API_KEY is exported in shell)
dotenvConfig({ override: true });

// Initialize Express app
const app = express();

// Middleware
// Configure CORS: allow env-configured list, fallback to dev origin, or allow all with "*"
const rawOrigins = process.env.CORS_ORIGINS || "http://localhost:5173";
const allowedOrigins = rawOrigins
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests or same-origin without Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  })
);
app.use(express.json());

// Routes
app.use("/api", PhoneRouter);
app.use("/api", ChatRouter);
app.use("/api", PixelRouter);


app.use((err, req, res, next) => {
  console.error(err);
  const payload = { error: "Internal Server Error" };
  if (process.env.NODE_ENV !== "production") {
    payload.message = err.message;
    payload.stack = err.stack;
  }
  res.status(500).json(payload);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
