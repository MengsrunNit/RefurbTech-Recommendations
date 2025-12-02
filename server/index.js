import express from "express";
import cors from "cors";
import PhoneRouter from "./routes/PhoneRouter.js";
import ChatRouter from "./routes/ChatRouter.js";
import PixelRouter from "./routes/PixelRoutes.js";
import PixelModelRouter from "./routes/PixelModelRouter.js";
import iphoneRouter from "./routes/iphoneRouter.js";
import RecommendationRouter from "./routes/RecommendationRouter.js";
import { config as dotenvConfig } from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env and override any existing env var (helps when a stale OPENAI_API_KEY is exported in shell)
// Try loading from current working directory first, then explicitly from the server directory
dotenvConfig({ override: true });
dotenvConfig({ path: path.join(__dirname, '.env'), override: true });

console.log("--- Environment Check ---");
console.log("OPENAI_API_KEY set:", !!process.env.OPENAI_API_KEY);
console.log("MONGODB_URI set:", !!process.env.MONGODB_URI);
console.log("-------------------------");

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
app.use("/api", iphoneRouter);
app.use("/api", PixelModelRouter);
app.use("/api", RecommendationRouter);



app.use((err, req, res, next) => {
  console.error(err);
  const payload = { error: "Internal Server Error" };

  // Expose configuration errors even in production to help with deployment
  if (err.message && (err.message.includes("OPENAI_API_KEY") || err.message.includes("Mongo"))) {
    payload.error = "Configuration Error";
    payload.message = err.message;
  }

  if (process.env.NODE_ENV !== "production") {
    payload.message = err.message;
    payload.stack = err.stack;
  }
  res.status(500).json(payload);
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
