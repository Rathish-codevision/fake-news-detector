# Veritas — Live Fake News Detector

Veritas is an AI-powered fake news detector. Paste any headline, claim, social post, or article snippet, and Veritas cross-checks it against reputable news sources and general world knowledge to return a structured credibility verdict in seconds.

Live demo: [fake-newsdetector.lovable.app](https://fake-newsdetector.lovable.app)

---

## ✨ Features

- 🔍 Detect anything — headlines, rumors, single sentences, or full articles
- 🧠 AI cross-analysis — powered by Google Gemini 2.5 Pro via the Lovable AI Gateway
- 📊 Structured verdict — `likely_true`, `likely_false`, `misleading`, or `unverified` with a confidence score (0–100%)
- 🚩 Red flags — manipulation tactics, sensationalism, and missing context surfaced
- ✅ Supporting points — what holds up under scrutiny
- 🔗 Cross-checked sources — reputable publications with stance (supports / refutes / context)
- 🎨 Polished UI — dark, glassmorphic design with smooth animations
- ⚡ SSR-ready — built on TanStack Start for fast first paint and SEO

---

### Environment

The following environment variables are required at runtime (auto-injected on Lovable Cloud):

```env
LOVABLE_API_KEY=...           # Lovable AI Gateway key
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

## 🧩 How It Works

1. The user submits any text via the textarea on `/`.
2. The client calls the `detectFakeNews` server function (`src/lib/detect.functions.ts`).
3. The server function validates input with Zod and forwards the claim to the Lovable AI Gateway.
4. Gemini 2.5 Pro is invoked with a structured `report_verdict` tool, forcing a JSON-shaped response.
5. The verdict (with reasoning, red flags, supporting points, and sources) is returned to the UI and rendered in a verdict card.

```
┌────────────┐    POST    ┌──────────────────┐    HTTPS   ┌─────────────────────┐
│  Browser   ├───────────▶│  Server Function ├───────────▶│  Lovable AI Gateway │
│  (React)   │◀───JSON────┤  (TanStack Start)│◀──JSON─────┤   Gemini 2.5 Pro    │
└────────────┘            └──────────────────┘            └─────────────────────┘
```

