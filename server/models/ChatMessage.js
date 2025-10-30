/**
 * ChatMessage: normalized message structure for our app.
 * role: "system" | "user" | "assistant"
 * content: string
 */
export class ChatMessage {
  constructor(role, content) {
    this.role = role;
    this.content = String(content ?? "");
  }

  static from(obj) {
    return new ChatMessage(obj.role, obj.content);
  }
}

/**
 * ChatTurn: a conversation turn containing the user's input and assistant output.
 * You can later persist this in a DB.
 */
export class ChatTurn {
  constructor(inputMessages = [], assistantReply = "") {
    this.inputMessages = inputMessages.map(ChatMessage.from);
    this.assistantReply = assistantReply;
    this.timestamp = new Date().toISOString();
  }
}
