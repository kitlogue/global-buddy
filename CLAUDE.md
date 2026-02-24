# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Global Buddy is a Next.js app for practicing English conversation via AI roleplay. Users select a real-life scenario (restaurant, airport, cafe, etc.) and chat with "Sarah", an AI English coach powered by Google Gemini.

## Tech Stack

- **Next.js 16.1.6** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **Google Gemini 2.0 Flash** (`@google/generative-ai`) — live AI responses
- **lucide-react** (icons)
- `@anthropic-ai/sdk` is installed but not currently used

## Project Structure

```
app/
  page.jsx          — Home screen: scenario selection grid
  layout.js         — Root layout
  globals.css       — Global styles
  chat/
    page.jsx        — Chat UI (message rendering, input, translation toggle)
  api/
    chat/
      route.js      — POST /api/chat → Gemini API handler
lib/
  scenarios.js      — All scenario definitions + shared prompt rules
App.js              — Original single-file prototype (preserved, not used)
```

## Architecture

### Scenario System (`lib/scenarios.js`)

`SCENARIOS` is an array of scenario objects, each with:
- `id` — URL param (e.g. `'restaurant'`)
- `label`, `emoji`, `description`, `color`, `accentColor` — UI display
- `systemPrompt` — full system prompt sent to Gemini
- `openingTrigger` — (optional) hidden first message that makes the AI open the conversation; absent for `'free'` (자유 대화)

Shared prompt rules are composed via constants:
- `KOREAN_TRANSLATION_RULE` — if user writes Korean, AI translates it first (`🇰🇷 → 🇺🇸`)
- `TRANSLATION_FORMAT` — AI appends Korean translation of its own response (`🇰🇷 "..."`)
- `KEEP_CONVERSATION_RULE` — AI always asks a follow-up, never ends abruptly
- `TIP_FORMAT` — AI evaluates user's English naturalness and optionally adds `💬 더 자연스럽게` with two alternatives

### API Route (`app/api/chat/route.js`)

`POST /api/chat` accepts `{ messages, scenario }`.
- Looks up `systemPrompt` via `getScenario(scenarioId)`
- Sends full conversation history to Gemini via `model.startChat({ history })`
- Returns `{ reply: string }`
- Requires `GOOGLE_API_KEY` in `.env.local`

### Chat UI (`app/chat/page.jsx`)

- Reads `?scenario=` from URL params
- If scenario has `openingTrigger`, sends it as a hidden message on mount so Sarah speaks first
- `parseAIMessage(text)` splits AI response into four parts:
  - `userTranslation` — Korean→English translation of user's input (`🇰🇷 → 🇺🇸`)
  - `main` — Sarah's actual English response
  - `translationText` — Korean translation of Sarah's response (`🇰🇷`)
  - `naturalness` — alternative phrasings from `💬 더 자연스럽게` block
- User messages display their translation + naturalness tips below the bubble
- AI messages show English main text; Korean translation is toggled via "번역 보기" button

### Home (`app/page.jsx`)

Renders a 2-column grid of scenario cards. Clicking navigates to `/chat?scenario=<id>`.

## Code Conventions

- Comments and UI text are in Korean
- Message objects: `{ id: number, text: string, sender: 'user' | 'ai', hidden?: boolean }`
- Toss-app–inspired styling: `rounded-[20px]` bubbles, `#3182f6` blue for user messages, max-width `400px` centered card
- Run dev server: `npm run dev` → http://localhost:3000

## Environment

`.env.local` must contain:
```
GOOGLE_API_KEY=your_key_here
```
