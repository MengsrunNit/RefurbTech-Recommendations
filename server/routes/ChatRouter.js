import { Router } from "express";
import rateLimit from "express-rate-limit";
import { ChatController } from "../controllers/ChatController.js";
import { validateChatBody } from "../middlewares/validate.js";

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // 60 requests/min per IP (tune as needed)
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/chat", chatLimiter, validateChatBody, ChatController.createChat);
router.post(
  "/chat/stream",
  chatLimiter,
  validateChatBody,
  ChatController.streamChat
);

export default router;
