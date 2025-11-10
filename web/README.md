# RefurbTech Web (Vue 3 + Vite)

## Chatbot widget

A floating chatbot widget is available globally and talks to the server API at `/api/chat`.

- Component: `src/components/Chatbot.vue`
- Rendered in: `src/App.vue`
- API base URL: `VITE_API_BASE_URL` (defaults to `http://localhost:3000` if not set)

### Run locally

1. Start the server (needs `OPENAI_API_KEY` in `.env`):
	- `cd server` and `npm start`
2. Start the web app:
	- `cd web` and `npm run dev`

Open `http://localhost:5173` and use the 💬 button in the bottom-right.

If your server is on a different host/port, create `web/.env.local` with:

```
VITE_API_BASE_URL=http://localhost:3000
```

### Notes

- The API expects a body `{ messages: [{ role, content }], options? }`.
- CORS is configured on the server for `http://localhost:5173` by default.
