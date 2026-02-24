# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Global Buddy is a single-file React chat UI prototype featuring an AI companion named "Sarah". It is designed to be used in an online IDE (e.g., StackBlitz, CodeSandbox) or pasted into an existing React project — there is no `package.json`, bundler, or test setup in this repository.

## Tech Stack

- **React** (functional components with `useState`, `useEffect`, `useRef`)
- **Tailwind CSS** (utility classes, no config file — assumes a CDN or pre-configured host environment)
- **lucide-react** (`Bot`, `Send` icons)

## Architecture

The entire application lives in `App.js` as a single default-exported component with three layout sections:

1. **Header** (`<header>`) — AI profile (Bot icon, name "AI 친구 (Sarah)", online status dot)
2. **Chat area** (`<main>`) — Scrollable message list; user messages are right-aligned blue bubbles, AI messages are left-aligned white bubbles. Auto-scrolls via `messagesEndRef`.
3. **Input footer** (`<footer>`) — Form with a text input and a Send button; submitting calls `handleSend`.

### Message flow

`handleSend` appends the user's message to `messages` state, clears the input, then uses `setTimeout` (1 s) to append a hardcoded AI response. There is no real AI backend — responses are a static string.

### Code conventions

- Comments throughout `App.js` are written in Korean.
- Message objects have the shape `{ id: number, text: string, sender: 'user' | 'ai' }`.
- Toss-app–inspired styling: flat design, `rounded-[20px]` bubbles, `#3182f6` blue for user messages.
