# Credit360 Enterprise — Credit Card Recommendation & Portfolio Intelligence Platform

Credit360 Enterprise is an institutional-grade credit card portfolio intelligence, customer profiling, and product comparison platform. It operates directly over **24,386,900 transaction records**, **2,000 customer accounts**, and **6,146 issued cards**, benchmarked against a competitive market universe of **354 commercial credit cards**.


## Architecture Overview
---
mermaid
flowchart TD
    subgraph DataLayer [Data & Storage Engine (Zero Sampling)]
        A[master_transactions.parquet<br/>24,386,900 Records] --> DB[(DuckDB OLAP Engine<br/>credit360.duckdb)]
        B[users_master.csv<br/>2,000 Accounts] --> DB
        C[cards_master.csv<br/>6,146 Cards] --> DB
        D[commercial_catalog<br/>354 Market Products] --> DB
    end
---
    subgraph BackendLayer [FastAPI High-Performance Engine - Port 8000]
        DB --> BE[FastAPI REST API]
        BE --> R1[/api/portfolio]
        BE --> R2[/api/customers]
        BE --> R3[/api/segments]
        BE --> R4[/api/cards/similarity]
        BE --> R5[/api/recommendations]
        BE --> R6[/api/fraud]
    end

    subgraph FrontendLayer [React UI - Port 5173]
        R1 & R2 & R3 & R4 & R5 & R6 --> FE[React 18 + Vite + Tailwind CSS]
        FE --> M1[Portfolio Demographics & Spend]
        FE --> M2[Customer Profiles 360° & Wallet]
        FE --> M3[Customer Personas - 6 Macro Groups]
        FE --> M4[Card Comparison & Market Directory]
        FE --> M5[Rewards Value Calculator]
        FE --> M6[Customer Risk Profiles]
    end
---



## Core Platform Modules

### 1. Portfolio Overview & Demographics
- **Total Population Scale**: Analyzes **$1,064,098,117.16** ($1.06B) in volume across **24,386,900 verified transactions** and **2,000 customer accounts**.
- **Visual Analytics**: 16 super-categories spend distribution, card network market share (Visa, Mastercard, Amex, Discover), 48-month longitudinal spend growth curve (1996–2020), and category CSV export.

### 2. Customer Profiles (360°) & Digital Wallet
- **Prominent Command Search**: Instant lookup for any customer across all 2,000 accounts by name or ID (e.g., `Jade Green` / `25`).
- **Demographics & Financial Metrics**: Experian bureau tiers, FICO scores, annual income, total debt, and debt-to-income (DTI) ratios.
- **Digital Cards in Wallet**: High-contrast card visualizer rendering brand, cardholder name, credit limits, card age, expiry, and chip security flags.
- **Recommendations**: Top tailored upgrades ranked by projected net annual reward yield, APR, annual fee, and spend multipliers.
- **Transaction Audit Ledger**: Filterable, paginated ledger of historical cleared and flagged transactions with CSV export.

### 3. Customer Personas & Spending Patterns (6 Macro Cohorts)
Maps 100% of accounts (2,000 customers) into exactly 6 distinct, balanced behavioral cohorts:
1. **Dining & Entertainment Enthusiasts** (343 accounts)
2. **Retail & Household Essentials Spenders** (300 accounts)
3. **Affluent Multi-Category & Travel Spenders** (562 accounts)
4. **Fuel & Daily Commute Power Users** (115 accounts)
5. **Digital & Lifestyle Natives** (452 accounts)
6. **Budget-Conscious Conservative Users** (228 accounts)

*Clicking any persona card opens a searchable, paginated customer roster. Clicking any customer row opens their full 360° profile.*

### 4. Commercial Card Comparison & Market Directory
Structured into 3 dedicated sub-tabs:
- **Head-to-Head Comparison**: Select any two commercial cards to inspect annual fees, base rates, sign-up bonuses, and category reward multipliers side-by-side, with advantage winners highlighted.
- **Card Substitutes & Alternatives**: Select any of the 354 commercial cards to view its 3 closest market rivals with fee differentials, plus a one-click button to compare head-to-head.
- **Commercial Card Directory**: Filter and search all 354 commercial cards by network (Visa, Mastercard, American Express, Discover) and annual fee tier ($0 No-Fee, $1–$100, $100+ Premium).

### 5. Card Rewards & Value Calculator (What-If Simulator)
- **Interactive Budget Sliders**: Adjust monthly budget allocations across Dining, Groceries, Travel, Shopping, and Utilities.
- **Dynamic Yield Simulation**: Recalculates net annual reward value across all 354 commercial cards in real time with interactive yield rankings.

### 6. Customer Risk Profiles & Historical Dispute Activity
- **Ground-Truth Exposure**: Tracks **29,757 confirmed unauthorized transactions** ($3,231,338.63 total exposure) and **388,431 terminal decline/technical errors**.
- **Historical Analysis**: Monthly breach trajectory (volume vs. incident count) and category vulnerability ranking with CSV export.

---

## Design System & Typography

- **Readability**: Built on Google Font **Roboto** with an elevated **18px base root** (`html { font-size: 18px }`). Eliminates cramped 6–8pt micro-fonts.
- **Color Palette**: Pitch-black canvas (`#000000`), matte carbon panels (`#090A0D`), hairline borders (`#1E2028`), Amex Royal Blue (`#006FCF`), and tabular numbers (`tabular-nums`).
- **Command Search**: Center-stage 760px wide search bar (`h-14`) with `⌘K` keyboard accelerator and large autocomplete cards.
- **Terminology**: Ground-truth historical data labeled accurately ("Customer Accounts", "Population Ledger", "Transaction Audit Ledger").

---

## Quickstart & Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements-eng.txt

# Start FastAPI server on port 8000
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Frontend Setup
```bash
# Navigate to frontend and install dependencies
cd frontend-react
npm install

# Start Vite dev server on port 5173
npm run dev
```
Web Console: [http://127.0.0.1:5173](http://127.0.0.1:5173)

### 4. Running Automated Tests
```bash
PYTHONPATH=. python3 tests/test_full_integration.py
```
Validates all 9 core integration benchmarks:
- Portfolio summary and category aggregations (24.38M transactions)
- Customer 360 profile and multi-card wallet extraction
- 6 macro persona clustering across all 2,000 customer accounts
- Commercial catalog (354 cards), substitutes, and head-to-head comparison
- What-If reward yield simulation engine
- Customer risk profile telemetry and dispute history

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend Engine** | FastAPI, DuckDB, Pandas, NumPy, Pydantic, Uvicorn |
| **Frontend Framework** | React 18, Vite, Tailwind CSS, Lucide Icons, Recharts |
| **Database & Analytics** | DuckDB (vectorized OLAP), Parquet, CSV |
| **Typography & UI** | Google Font Roboto (18px base root), Tabular Figures |
