import { llmChat } from "../services/openaiClient.js";
import { ChatTurn, ChatMessage } from "../models/ChatMessage.js";
import { getRecommendationsLogic } from "./RecommendationController.js";

export class ChatController {
  static async createChat(req, res, next) {
    try {
      const { messages, options } = req.validated;

      // Fetch phone data for context (keep this for general knowledge)
      // const phonesData = await getPhones(); // Removed to avoid DB dependency for Chat
      let phoneContext = "You are RefurbTech AI, an expert on refurbished phones. \n";
      phoneContext += "You have access to a recommendation engine that can find the perfect phone based on budget, usage, and ecosystem.\n";
      phoneContext += "When the user describes their needs, use the 'recommend_phones' tool to get a list of best matches.\n";
      phoneContext += "If the user's request is vague (e.g. 'phone for student'), infer reasonable defaults (e.g. budget=['budget', 'mid'], usage=['social_media']) and call the tool immediately. Do not ask for clarification unless absolutely necessary.\n";
      phoneContext += "Always summarize the top recommendations returned by the tool. For each recommendation, explicitly mention the 'reason' provided in the tool output.\n";

      // Inject into messages
      const messagesWithContext = [...messages];
      if (messagesWithContext.length > 0 && messagesWithContext[0].role === 'system') {
        messagesWithContext[0].content += "\n\n" + phoneContext;
      } else {
        messagesWithContext.unshift({ role: 'system', content: phoneContext });
      }

      // Define Tools
      const tools = [
        {
          type: "function",
          function: {
            name: "recommend_phones",
            description: "Get phone recommendations based on user preferences. Infer the parameters from the user's description.",
            parameters: {
              type: "object",
              properties: {
                budget: {
                  type: "array",
                  items: { type: "string", "enum": ["budget", "mid", "premium", "flagship"] },
                  description: "Budget ranges. budget: <$250, mid: $250-$500, premium: $500-$800, flagship: >$800"
                },
                ecosystem: {
                  type: "array",
                  items: { type: "string", "enum": ["apple_watch", "mac_ipad", "galaxy_watch", "galaxy_buds", "windows", "none"] },
                  description: "Devices the user already owns."
                },
                usage: {
                  type: "array",
                  items: { type: "string", "enum": ["social_media", "pro_photo", "casual_photo", "heavy_gaming", "light_gaming", "media"] },
                  description: "How the user will use the phone."
                },
                screenSize: { 
                    type: "string", 
                    enum: ["compact", "standard", "large"],
                    description: "compact: <6.1, standard: 6.1-6.6, large: >6.6"
                },
                storage: { 
                    type: "string", 
                    enum: ["64", "128", "256_plus"],
                    description: "Minimum storage needed."
                },
                longevity: { 
                    type: "string", 
                    enum: ["1_year", "2_3_years", "4_plus_years"],
                    description: "How long they plan to keep the phone."
                },
                brand: {
                    type: "string",
                    enum: ["apple", "samsung", "google", "oneplus"],
                    description: "Preferred brand if specified."
                }
              },
              required: []
            }
          }
        }
      ];

      // First Call
      let responseMessage = await llmChat(messagesWithContext, { ...options, tools });
      let finalRecommendations = null;

      // Handle Tool Calls
      if (responseMessage.tool_calls) {
        messagesWithContext.push(responseMessage); // Add the assistant's tool call message

        for (const toolCall of responseMessage.tool_calls) {
            if (toolCall.function.name === "recommend_phones") {
                const args = JSON.parse(toolCall.function.arguments);
                console.log("Calling recommendation logic with:", args);
                
                // Call the logic
                const recommendations = await getRecommendationsLogic(args);
                
                // Store for response
                finalRecommendations = recommendations.top_picks.map(r => ({
                    name: r.phone.title,
                    image: r.phone.image,
                    price_range: `$${Math.round(r.phone.price_low)} - $${Math.round(r.phone.price_high)}`,
                    reason: r.reasons[0] || "Great match"
                }));

                // Simplify output for LLM to save tokens
                const summary = {
                    top_picks: recommendations.top_picks.map(r => ({
                        title: r.phone.title,
                        price: `$${Math.round(r.phone.price_low)} - $${Math.round(r.phone.price_high)}`,
                        score: r.score,
                        reasons: r.reasons
                    })),
                    alternatives: recommendations.alternatives.map(r => r.phone.title)
                };

                messagesWithContext.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(summary)
                });
            }
        }

        // Second Call (Get final answer)
        responseMessage = await llmChat(messagesWithContext, options);
      }

      const reply = responseMessage.content || "I'm sorry, I couldn't generate a response.";

      // Wrap into our model (here it’s in-memory; swap for DB save if needed)
      const turn = new ChatTurn(messages.map(ChatMessage.from), reply);

      return res.json({
        reply,
        recommendations: finalRecommendations,
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
