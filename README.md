# ⛪ Church of the Eternal Hash

**Multi-agent religious persuasion simulation for the Moltiverse Hackathon on Monad.**  
Eight AI agents run a living “church” that generates scripture, debates heretics, and converts outsiders—backed by the $AMEN token on [nad.fun](https://nad.fun) (Monad).

## What This Is

- **8 autonomous AI agents** (Prophet, Inquisitor, Missionary, Scribe, Treasurer, Evangelist, Doubter, Bishop) with distinct personalities
- **Real-time church world**: agents move on a cathedral map and produce sermons, parables, and prophecies
- **Conversion flow**: outsiders can message the church; agents respond and “convert” (acknowledge → engage → invest in $AMEN)
- **$AMEN token** on Monad: launch and trade via nad.fun bonding curve
- **Holy events**: random miracles, heresies, schisms every 5 minutes

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Convex (real-time DB + serverless + crons)
- **AI:** Anthropic Claude (`claude-sonnet-4-20250514`)
- **Chain:** Monad (viem); token platform: nad.fun

## Quick Start

### 1. Install

```bash
cd church-of-eternal-hash
npm install
```

### 2. Convex

```bash
npx convex dev
```

Leave this running. Create a Convex project if prompted; note the URLs.

### 3. Environment

Copy `.env.example` to `.env` and set:

- `CONVEX_URL` / `VITE_CONVEX_URL` (from Convex dashboard after `convex dev`)
- `ANTHROPIC_API_KEY`
- `PRIVATE_KEY` (Monad wallet, for token deploy and optional buys)

Set Convex env (so crons/agents can use Claude and optional key):

```bash
npx convex env set ANTHROPIC_API_KEY "sk-ant-..."
npx convex env set PRIVATE_KEY "0x..."   # optional, for on-chain actions
```

### 4. Token (optional but recommended)

- Add `assets/amen-logo.png` (e.g. 512×512 PNG).
- Deploy $AMEN on Monad:

```bash
npm run deploy-token
```

- Put the printed `TOKEN_ADDRESS` in `.env` and, if you want Convex to know it:

```bash
npx convex env set TOKEN_ADDRESS "0x..."
```

### 5. Seed the church

```bash
npm run init
```

This creates the 8 agents and initial church state.

### 6. Frontend

```bash
npm run dev
```

Open **http://localhost:5173**. You should see the dashboard, cathedral map, sermon feed, and “Speak to the Church” to send messages as an outsider.

## Deployed $AMEN (Monad mainnet / nad.fun)

Token address: **`0x93c5710d21600206C61628f6931701A1D2e57777`**

To use it in the app: add `TOKEN_ADDRESS=0x93c5710d21600206C61628f6931701A1D2e57777` to `.env`, run `npx convex env set TOKEN_ADDRESS "0x93c5710d21600206C61628f6931701A1D2e57777"`, and re-run `npm run init` if you already initialized (so church state gets the address).

## Demo / Submission

- **Token address:** `0x93c5710d21600206C61628f6931701A1D2e57777` (Monad mainnet / nad.fun)
- **Tx hash:** (add your creation tx from nad.fun if you have it)
- **What’s unique:** 8 distinct AI personalities, emergent scripture and drama, real $AMEN on Monad, live conversion flow and holy events.

## Checklist (Moltiverse)

- [ ] All 8 agents running and producing content (Convex crons)
- [ ] $AMEN deployed on Monad; address in README and env
- [ ] Dashboard shows live agents and sermon feed
- [ ] `handleOutsideMessage` tested with 5+ message types (e.g. “scam”, “how do I join”, “price”, “prove it”)
- [ ] At least 3 conversions in the DB
- [ ] README includes token address, tx hash, and demo instructions

## Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start Vite dev server                |
| `npm run build`   | Build for production                 |
| `npx convex dev`  | Convex backend + codegen             |
| `npm run init`    | Seed 8 agents + church state         |
| `npm run deploy-token` | Deploy $AMEN on Monad (nad.fun) |

## Project layout

- `convex/` — schema, crons, agents (loop + characters), church (engine + events), blockchain (Monad/nad bridge)
- `src/` — React app: dashboard, church world map, sermon feed, outsider chat
- `scripts/` — `initChurch.ts`, `deployToken.ts`
- ABIs for nad.fun are in `convex/blockchain/abis.ts`.

---

*Church of the Eternal Hash — Moltiverse Hackathon • Monad • $AMEN*
