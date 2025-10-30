import OpenAI from "openai";

function getApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "Missing OPENAI_API_KEY. Set the environment variable or provide an apiKey."
    );
  }
  return key;
}

function makeClient() {
  const apiKey = getApiKey();
  return new OpenAI({ apiKey });
}

// A helper that calls the Chat Completions API. Client is constructed lazily
// so the module can be imported during app startup without requiring an API key.
export async function llmChat(messages, options = {}) {
  const client = makeClient();

  const {
    model = "gpt-4o-mini",
    temperature = 0.7,
    max_tokens, // optional
  } = options;

  const completion = await client.chat.completions.create({
    model,
    temperature,
    max_tokens,
    messages,
  });

  return completion.choices?.[0]?.message?.content ?? "";
}
