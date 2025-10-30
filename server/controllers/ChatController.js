import { llmChat } from "../services/openaiClient.js";
import { ChatTurn, ChatMessage } from "../models/ChatMessage.js";
// If using Mongo, import ChatTurnModel and save() instead.

export class ChatController {
  static async createChat(req, res, next) {
    try {
      const { messages, options } = req.validated;

      // Basic guardrail example (size limit)
      const totalChars = messages.reduce((n, m) => n + m.content.length, 0);
      if (totalChars > 8000) {
        return res.status(413).json({ error: "Message too long" });
      }

      const reply = await llmChat(messages, options);

      // Wrap into our model (here it’s in-memory; swap for DB save if needed)
      const turn = new ChatTurn(messages.map(ChatMessage.from), reply);

      return res.json({
        reply,
        turn, // or turnDoc
      });
    } catch (err) {
      next(err);
    }
  }

  // Optional: streaming (SSE)
  static async streamChat(req, res, next) {
    try {
      const { messages, options } = req.validated;

      // Prepare SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Use OpenAI stream
      // NOTE: the official SDK supports async iteration on a stream when `stream: true`.
      // We’ll keep this simple and not include per-chunk tool calls.
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const stream = await client.chat.completions.create({
        model: options?.model ?? "gpt-4o-mini",
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens,
        stream: true,
        messages,
      });

      let full = "";

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          full += delta;
          res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, full })}\n\n`);
      res.end();
    } catch (err) {
      next(err);
    }
  }
}
