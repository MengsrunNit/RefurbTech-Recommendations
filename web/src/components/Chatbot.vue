<template>
  <div class="rt-chatbot" :class="{ open: isOpen }">
    <button
      class="rt-toggle"
      @click="toggleOpen"
      :aria-label="isOpen ? 'Close chatbot' : 'Open chatbot'"
      :class="{ 'has-unread': unreadCount > 0 }"
      :data-unread="unreadCount > 99 ? '99+' : unreadCount || null"
    >
      <svg
        v-if="!isOpen"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 3C7.03 3 3 6.58 3 11c0 2.24 1.08 4.27 2.82 5.75C5.58 19.7 4.5 21 3 22c2.5 0 4.35-.93 5.58-1.86C9.5 20.7 10.72 21 12 21c4.97 0 9-3.58 9-8s-4.03-10-9-10Z"
          stroke="currentColor"
          stroke-width="1.2"
        />
      </svg>
      <svg
        v-else
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M6 6l12 12M6 18L18 6"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
    </button>

    <!-- Full-screen scrim to separate chat from background and improve readability -->
    <div
      v-if="isOpen"
      class="rt-scrim"
      @click="toggleOpen"
      aria-hidden="true"
    ></div>

    <transition name="panel-scale" appear>
      <div
        v-if="isOpen"
        class="rt-panel"
        role="dialog"
        aria-label="RefurbishTech Chatbot"
      >
        <header class="rt-header">
          <div class="rt-header-main">
            <span class="rt-dot" aria-hidden="true"></span>
            <div class="rt-title">
              <strong>RefurbishTech Assistant</strong>
              <small class="rt-sub">Phones • Specs • Pricing</small>
            </div>
          </div>
          <div class="rt-header-actions">
            <span class="rt-badge" :title="`Model: ${MODEL_NAME}`">{{
              MODEL_NAME
            }}</span>
            <button
              class="icon-btn"
              @click="resetConversation"
              title="New chat"
              aria-label="Start a new chat"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 12a9 9 0 1115.48 6.36M21 12a9 9 0 00-15.48-6.36M3 12h4M7 12l-2 2M7 12l-2-2"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div ref="scrollEl" class="rt-messages" @scroll="onScroll">
          <transition-group name="fade-up" tag="div">
            <div
              v-for="(m, idx) in enhancedMessages"
              :key="idx + '-' + m.role"
              class="rt-msg"
              :class="[m.role, { first: m.isFirst, last: m.isLast }]"
            >
              <div
                v-if="m.isFirst"
                class="avatar"
                :class="m.role"
                aria-hidden="true"
              >
                {{ m.role === "user" ? "U" : "A" }}
              </div>
              <div
                class="bubble"
                :class="[m.role, { first: m.isFirst, last: m.isLast }]"
              >
                <div class="content" v-html="renderMarkdown(m.content)"></div>
                <div class="meta">{{ formatTime(m.ts) }}</div>
              </div>
            </div>
          </transition-group>

          <div v-if="showSuggestions" class="rt-suggestions" role="list">
            <button
              class="chip"
              role="listitem"
              v-for="(s, i) in suggestions"
              :key="i"
              @click="useSuggestion(s)"
            >
              {{ s }}
            </button>
          </div>

          <div v-if="store.selectedPhones.length > 0" class="rt-msg assistant">
            <div class="avatar assistant" aria-hidden="true">A</div>
            <div class="bubble">
              <div class="content">
                <p>
                  You have selected {{ store.selectedPhones.length }} phones for
                  comparison:
                </p>
                <ul>
                  <li v-for="phone in store.selectedPhones" :key="phone.title">
                    {{ phone.title }}
                  </li>
                </ul>
                <button class="compare-btn-chat" @click="goToComparison">
                  Compare Now
                </button>
              </div>
              <div class="meta">Just now</div>
            </div>
          </div>

          <div v-if="loading" class="rt-msg assistant">
            <div class="avatar assistant" aria-hidden="true">A</div>
            <div class="bubble typing">
              <span class="dot"></span><span class="dot"></span
              ><span class="dot"></span>
            </div>
          </div>

          <button
            v-show="showScrollBtn"
            class="scroll-btn"
            @click="scrollToBottom"
            aria-label="Scroll to latest"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <footer class="rt-input">
          <form @submit.prevent="send">
            <textarea
              ref="inputRef"
              v-model="input"
              rows="1"
              placeholder="Ask about a model, budget, or specs…"
              :disabled="loading"
              @input="autoResize"
              @keydown.enter.exact.prevent="send"
              @keydown.enter.shift.stop
            />
            <button
              class="send-btn"
              type="submit"
              :disabled="loading || !input.trim()"
              aria-label="Send message"
            >
              <span v-if="!loading">Send</span>
              <span v-else class="spinner" aria-hidden="true"></span>
            </button>
          </form>
          <p class="hint">Shift+Enter for newline</p>
          <p v-if="error" class="rt-error" role="alert">{{ error }}</p>
        </footer>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { store } from "../store.js";

const router = useRouter();

// Config: prefer env var, fallback to localhost
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const CHAT_URL = `${API_BASE}/api/chat`;
const MODEL_NAME = "gpt-4o-mini";

const isOpen = ref(false);
const input = ref("");
const loading = ref(false);
const error = ref("");
const scrollEl = ref(null);
const inputRef = ref(null);
const showScrollBtn = ref(false);
const unreadCount = ref(0);

const goToComparison = () => {
  const phoneNames = store.selectedPhones.map((p) => p.title).join(",");
  router.push({ path: "/comparison", query: { phones: phoneNames } });
  isOpen.value = false; // Close chat when navigating
};

// Keep the running conversation so the backend has context
const messages = ref([
  {
    role: "system",
    content:
      "You are RefurbishTech, a helpful assistant for refurbished phones. Be concise and practical.",
  },
  {
    role: "assistant",
    content:
      "Hi! Ask me anything about phone models, specs, or refurbished pricing.",
    ts: Date.now(),
  },
]);

const visibleMessages = computed(() =>
  messages.value.filter((m) => m.role !== "system")
);

// Group-aware metadata to style bubbles like Telegram/Messenger
const enhancedMessages = computed(() => {
  const list = visibleMessages.value;
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const prev = list[i - 1];
    const next = list[i + 1];
    const sep = 5 * 60 * 1000; // 5 minutes separates groups
    const isFirst =
      !prev || prev.role !== m.role || (m.ts ?? 0) - (prev?.ts ?? 0) > sep;
    const isLast =
      !next || next.role !== m.role || (next?.ts ?? 0) - (m.ts ?? 0) > sep;
    out.push({ ...m, isFirst, isLast });
  }
  return out;
});

const suggestions = ref([
  "Recommend a phone under $300",
  "Compare Pixel 7 vs iPhone 13",
  "Best battery life phones right now?",
]);

const showSuggestions = computed(
  () => visibleMessages.value.filter((m) => m.role === "user").length === 0
);

function toggleOpen() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) focusInputSoon();
  if (isOpen.value) unreadCount.value = 0;
}

function focusInputSoon() {
  // focus the input after panel opens
  nextTick(() => {
    const el = inputRef.value || document.querySelector(".rt-input textarea");
    el && el.focus();
  });
}

watch(
  messages,
  async () => {
    await nextTick();
    try {
      if (scrollEl.value) {
        scrollEl.value.scrollTop = scrollEl.value.scrollHeight;
      }
    } catch {}
  },
  { deep: true }
);

async function send() {
  const text = input.value.trim();
  if (!text || loading.value) return;
  error.value = "";

  // Append user message
  messages.value.push({ role: "user", content: text, ts: Date.now() });
  input.value = "";
  loading.value = true;

  try {
    const payload = {
      messages: messages.value.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      options: { model: MODEL_NAME, temperature: 0.7 },
    };
    const { data } = await axios.post(CHAT_URL, payload, { timeout: 30000 });
    const reply = data?.reply ?? "";
    messages.value.push({
      role: "assistant",
      content: String(reply),
      ts: Date.now(),
    });
    if (!isOpen.value) unreadCount.value++;
  } catch (err) {
    console.error(err);
    error.value = parseAxiosError(err);
    // Provide a soft fallback message so UI keeps flowing
    messages.value.push({
      role: "assistant",
      content: "Sorry, I ran into a problem answering that. Please try again.",
      ts: Date.now(),
    });
  } finally {
    loading.value = false;
  }
}

function parseAxiosError(err) {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.message?.includes("Network"))
    return "Unable to reach server. Is it running at " + API_BASE + "?";
  return "Unexpected error. Try again later.";
}

const onKeyDown = (e) => {
  if (e.key === "Escape" && isOpen.value) toggleOpen();
};
onMounted(() => {
  // Optionally open on mount on small screens: keep closed by default
  window.addEventListener("keydown", onKeyDown);
});
onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
});

function resetConversation() {
  messages.value = [
    {
      role: "system",
      content:
        "You are RefurbishTech, a helpful assistant for refurbished phones. Be concise and practical.",
    },
    {
      role: "assistant",
      content: "New chat started. How can I help?",
      ts: Date.now(),
    },
  ];
  error.value = "";
  nextTick(() => focusInputSoon());
}

function formatTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function useSuggestion(text) {
  input.value = text;
  focusInputSoon();
}

function autoResize(e) {
  const el = e?.target || inputRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

// Markdown rendering (safe)
marked.setOptions({ breaks: true, gfm: true });
function renderMarkdown(text) {
  const raw = String(text ?? "");
  const html = marked.parse(raw);
  return DOMPurify.sanitize(html);
}

function onScroll() {
  const el = scrollEl.value;
  if (!el) return;
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  showScrollBtn.value = !atBottom;
}

function scrollToBottom() {
  const el = scrollEl.value;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  showScrollBtn.value = false;
}
</script>

<style scoped>
/* Theme tokens (inherits from app, but tuned here) */
:root {
  --rt-bg: #0e1526;
  --rt-bg-elev: #0f1b33;
  --rt-border: rgba(96, 165, 250, 0.2);
  --rt-muted: #9fb0c3;
  --rt-text: #e6edf7;
  --rt-brand1: #22d3ee;
  --rt-brand2: #60a5fa;
}

.rt-chatbot {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000; /* ensure above page content */
}
.rt-scrim {
  position: fixed;
  inset: 0;
  background: rgba(7, 12, 24, 0.48);
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  z-index: 1000;
}
.rt-toggle {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: linear-gradient(
    180deg,
    rgba(34, 211, 238, 0.28),
    rgba(96, 165, 250, 0.28)
  );
  color: #fff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.rt-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.36);
}
.rt-toggle:active {
  transform: translateY(0);
}
.rt-toggle:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

.rt-toggle::after {
  /* unread pill */
  content: attr(data-unread);
  display: none;
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: #ef4444;
  color: #fff;
  border-radius: 999px;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  border: 2px solid #0e1526;
}
.rt-toggle.has-unread::after {
  display: inline-block;
}

.rt-panel {
  position: absolute;
  right: 0;
  bottom: 68px;
  width: min(96vw, 420px);
  max-height: min(72vh, 680px);
  display: flex;
  flex-direction: column;
  background: var(--rt-bg);
  border: 1px solid var(--rt-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
  z-index: 1001; /* on top of scrim */
}
.rt-header {
  padding: 12px 12px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.18);
  background: linear-gradient(
    180deg,
    rgba(34, 211, 238, 0.08),
    rgba(96, 165, 250, 0.08)
  );
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rt-header-main {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 10px rgba(52, 211, 153, 0.6);
}
.rt-title strong {
  display: block;
  font-size: 14px;
}
.rt-sub {
  color: #9fb0c3;
  font-size: 12px;
}
.rt-badge {
  font-size: 11px;
  color: #dbeafe;
  background: rgba(59, 130, 246, 0.2);
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.rt-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.icon-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #e5e7eb;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
}
.icon-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.rt-messages {
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: radial-gradient(
      1200px 600px at 0% -20%,
      rgba(96, 165, 250, 0.1),
      transparent
    ),
    radial-gradient(
      900px 500px at 110% -10%,
      rgba(34, 211, 238, 0.1),
      transparent
    );
}
.rt-msg {
  display: flex;
  gap: 8px;
}
.rt-msg.system {
  justify-content: center;
}
.rt-msg.user {
  justify-content: flex-end;
}
.rt-msg.assistant {
  justify-content: flex-start;
}

.avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #0b1220;
  background: #cfe8ff;
  border: 1px solid rgba(255, 255, 255, 0.18);
  align-self: flex-end;
}
.rt-msg.user .avatar {
  order: 2;
}
.avatar.user {
  background: #93c5fd;
}
.avatar.assistant {
  background: #a7f3d0;
}

.bubble {
  max-width: 76%;
  padding: 10px 12px 18px; /* extra bottom for timestamp */
  border-radius: 18px;
  word-break: break-word;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
/* Bubble colors like Messenger */
.bubble.user {
  background: #2563eb;
  color: #fff;
  border-color: rgba(37, 99, 235, 0.7);
}
.bubble.assistant {
  background: #1f2937;
  color: #e6edf7;
  border-color: rgba(255, 255, 255, 0.06);
}
.rt-msg.system .bubble {
  background: rgba(255, 255, 255, 0.06);
}

.content {
  margin: 0;
  font-family: inherit;
  font-size: 14px;
  white-space: pre-wrap; /* keep user newlines */
  word-break: break-word; /* break long words */
  overflow-wrap: anywhere; /* break long URLs/strings */
  line-height: 1.45;
}
.content p {
  margin: 0 0 0.5rem;
}
.content ul,
.content ol {
  margin: 0 0 0.5rem 0.9rem;
  padding-left: 1rem;
}
.content li {
  margin: 0.15rem 0;
}
.meta {
  position: absolute;
  bottom: 6px;
  right: 10px;
  font-size: 11px;
  opacity: 0.8;
  color: rgba(255, 255, 255, 0.85);
}
.bubble.assistant .meta {
  color: #9fb0c3;
}

/* Typing indicator */
.typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cfe8ff;
  opacity: 0.4;
  animation: blink 1s infinite ease-in-out;
}
.dot:nth-child(2) {
  animation-delay: 0.15s;
}
.dot:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes blink {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

.rt-input {
  border-top: 1px solid rgba(96, 165, 250, 0.18);
  padding: 8px;
  background: var(--rt-bg-elev);
}
.rt-input form {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.rt-input textarea {
  flex: 1;
  background: #0b1220;
  color: #e6edf7;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  resize: none;
  max-height: 140px;
}
.send-btn {
  min-width: 72px;
  height: 36px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0 14px;
  cursor: pointer;
}
.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.hint {
  color: var(--rt-muted);
  font-size: 11px;
  margin: 6px 2px 0;
}

.rt-error {
  color: #ffb4b4;
  font-size: 12px;
  margin: 6px 2px 2px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.rt-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 6px 0 2px;
}
.chip {
  background: rgba(255, 255, 255, 0.06);
  color: #e6edf7;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}
.chip:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Subtle list entrance */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.18s ease;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Panel scale/opacity entrance */
.panel-scale-enter-active,
.panel-scale-leave-active {
  transition: all 0.16s ease-in-out;
}
.panel-scale-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
.panel-scale-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

/* Bubble tails */
.rt-msg.user .bubble::after,
.rt-msg.assistant .bubble::after {
  content: "";
  position: absolute;
  bottom: 0;
  width: 12px;
  height: 12px;
  transform: translateY(20%) rotate(45deg);
}
.rt-msg.user .bubble::after {
  right: -6px;
  background: #2563eb;
  border-right: 1px solid rgba(37, 99, 235, 0.7);
  border-bottom: 1px solid rgba(37, 99, 235, 0.7);
}
.rt-msg.assistant .bubble::after {
  left: -6px;
  background: #1f2937;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

/* Group rounding tweaks (first/last bubble in a sequence) */
.rt-msg.user .bubble.first {
  border-top-right-radius: 18px;
  border-bottom-right-radius: 6px;
}
.rt-msg.user .bubble.last {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 18px;
}
.rt-msg.assistant .bubble.first {
  border-top-left-radius: 18px;
  border-bottom-left-radius: 6px;
}
.rt-msg.assistant .bubble.last {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 18px;
}

/* Scroll-to-bottom button */
.scroll-btn {
  position: sticky;
  bottom: 8px;
  margin-left: auto;
  background: rgba(37, 99, 235, 0.9);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}
.scroll-btn:hover {
  background: rgba(37, 99, 235, 1);
}
.scroll-btn:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

@media (max-width: 420px) {
  .rt-panel {
    width: min(98vw, 400px);
  }
}

/* Markdown code styling */
.content pre {
  background: rgba(2, 6, 23, 0.6);
  color: #e5e7eb;
  padding: 10px;
  border-radius: 10px;
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.content code {
  background: rgba(2, 6, 23, 0.5);
  padding: 1px 4px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.compare-btn-chat {
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  width: 100%;
}

.compare-btn-chat:hover {
  opacity: 0.9;
}
</style>
