# ScolarSync

A student companion app with AI chat assistant.

## Project Structure

```
scholarsync-full/
├── scholarsync/     → React Native / Expo mobile app
└── api-server/      → Express backend (AI chat API)
```

## Getting Started

### 1. Start the API Server
```bash
cd api-server
npm install
cp .env.example .env
# Add your Anthropic API key to .env
npm run dev
```

### 2. Start the Mobile App
```bash
cd scholarsync
npm install
npm start
```

## Environment Variables (api-server/.env)
- `PORT` — port to run the server on (e.g. 3000)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — your Anthropic API key
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — leave as https://api.anthropic.com
