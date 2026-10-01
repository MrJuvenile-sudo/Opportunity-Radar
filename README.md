# 📡 Opportunity Radar

> Real-time web discovery and AI-powered personalization engine for hackathons, internships, fellowships, grants, and competitions.

Built with **Next.js (App Router)**, **TinyFish SDK** for live web exploration, and **Google Gemini Flash-Lite** for natural language requirement extraction and tailored fit analysis.

---

## 🌟 Key Features

- **Natural Language Querying**: Enter free-form queries (e.g., *"I'm a college student in India interested in AI. Find hackathons and fellowships"*).
- **Structured Requirement Extraction**: Gemini Flash-Lite analyzes queries into structured criteria: location, academic level, domain interests, opportunity types, and discovery keywords.
- **Live Web Discovery via TinyFish**: Scours real-time web indexes and portals for active, verified opportunities with actual URLs.
- **AI Synthesis & Fit Analysis**: Gemini ranks matches (*High*, *Medium*, *Low*), eliminates irrelevant items, and explains why each opportunity matches your background.
- **Interactive Results Filter Bar**:
  - Filter by opportunity category (*Hackathons*, *Internships*, *Fellowships*, *Grants*, *Competitions*).
  - Filter by match tier (*High Match Only*).
  - Instant in-memory search across title, organization, tags, and location.
  - Multi-criteria sorting (*Best Match*, *Title A–Z*, *Organization A–Z*).
- **Bookmarking / Saved Drawer**: Save opportunities locally to your browser and manage them under the dedicated "Saved" tab.
- **Data Export**: One-click download of filtered or bookmarked opportunities as **CSV** or **JSON**.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router + Turbopack)](https://nextjs.org/)
- **AI Model**: Google Gemini Flash-Lite via [`@google/genai`](https://www.npmjs.com/package/@google/genai)
- **Web Discovery**: [TinyFish SDK](https://tinyfish.ai/) via [`@tiny-fish/sdk`](https://www.npmjs.com/package/@tiny-fish/sdk)
- **Language**: TypeScript
- **Styling**: Vanilla CSS Modules (Glassmorphic dark design system)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/MrJuvenile-sudo/Opportunity-Radar.git
cd Opportunity-Radar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and insert your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Gemini API Key (from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# TinyFish API Key (from https://tinyfish.ai/)
TINYFISH_API_KEY=your_tinyfish_api_key_here

# Default Gemini Model
GEMINI_MODEL=gemini-3.5-flash-lite
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build

```bash
npm run build
npm start
```

---

## 📄 License

MIT
