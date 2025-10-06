import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from Node/Express 👋" });
});

app.post("/api/echo", (req, res) => {
  console.log("Body received:", req.body);
  const { text } = req.body ?? {};
  res.json({ echo: text ? `You said: ${text}` : "No text received" });
});

app.listen(3000, () =>
  console.log("✅ Server running on http://localhost:3000")
);
