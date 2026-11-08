# Credit360 Enterprise — Credit Card Recommendation & Portfolio Intelligence Platform

Credit360 Enterprise is an institutional-grade credit card portfolio intelligence, customer profiling, and product comparison platform. It operates directly over **24,386,900 transaction records**, **2,000 customer accounts**, and **6,146 issued cards**, integrated with a competitive market universe of **354 commercial credit cards**.

---

## 1. Problem Statement & Data Description

### The Problem
Traditional credit card recommendation systems in retail banking suffer from three core operational flaws:
1. **Static Heuristics & FICO Bias**: Most card recommenders rely almost exclusively on credit scores or static user surveys rather than analyzing dynamic, longitudinal spending footprints across merchant categories.
2. **Product Misalignment & Churn**: Customers receive generic card offers that do not align with their top spending categories (e.g., offering airline miles cards to customers spending 40% on suburban grocery stores), eroding customer loyalty and interchange revenue.
3. **Operational Scale & Latency Bottlenecks**: Processing dozens of millions of historical transactions for behavioral feature extraction usually requires heavy, slow batch pipelines that cannot power an interactive decision console in real time.

Credit360 solves these challenges by combining a high-performance **DuckDB vectorized OLAP engine** over the full 24.38M transaction population with machine learning models for fraud risk detection, customer spend forecasting, behavioral persona clustering, and nearest-neighbor commercial card matching.

---

### Dataset Scale & Schema Breakdown

The platform operates without synthetic downsampling on four ground-truth relational datasets:

| Dataset | Record Count | File Format | Primary Key / Index | Description & Scope |
|---|---|---|---|---|
| **Transactions** | **24,386,900** | Apache Parquet (`master_transactions.parquet`) | `(User, Card, Transaction_Timestamp)` | Longitudinal transaction ledger spanning 1996 through 2020 ($1.06B volume). Contains amount, timestamp, merchant name, MCC, chip usage, error codes, and fraud labels. |
| **Customer Accounts** | **2,000** | CSV (`users_master.csv`) | `user_id` | Core demographics: Age (18–85), Gender, Annual Income ($21k–$145k), Total Debt, FICO Score (480–850), Location (City, State, Zip), and Life Stage. |
| **Issued Portfolio Cards** | **6,146** | CSV (`cards_master.csv`) | `(User, CARD INDEX)` / `Card Number` | All customer cards across Visa, Mastercard, Amex, and Discover; Debit, Credit, and Prepaid types; credit limits, account open dates, and dark web compromise flags. |
| **Commercial Card Catalog** | **354** | CSV (`commercial_canonical_feature_matrix_v1.csv`) | `card_id` | Competitive benchmark universe of 354 US commercial credit cards across 38 major issuers with category reward multipliers, annual fees ($0 to $695), base rates, and bonus values. |

---

## 2. Basic Data Summary & Exploratory Analysis

The full portfolio represents over two decades of consumer credit behavior across the United States. Below is the ground-truth statistical summary:

### Macro Portfolio Telemetry

| Metric | Ground-Truth Value | Description |
|---|---|---|
| **Total Managed Transaction Volume** | **$1,064,098,117.16** | Over $1.06 Billion in lifetime settled card volume |
| **Total Population Records** | **24,386,900** | 100% full population (zero sampling applied) |
| **Total Customer Accounts** | **2,000** | Unique audited retail cardholder profiles |
| **Total Active & Issued Cards** | **6,146** | Average of 3.07 cards per customer wallet |
| **Mean Ticket Size** | **$43.63** | Average transaction amount across all categories |
| **Confirmed Unauthorized Transactions** | **29,757** | 0.122% historical fraud incidence ($3.23M total exposure) |
| **Terminal Transmission & Decline Errors** | **388,431** | 1.59% error rate (declines, PIN faults, technical timeouts) |
| **Merchant Network Points** | **100,343** | Distinct retail merchant locations |

### Spending Distribution by Merchant Super-Category

| Spending Category | Share of Total Transactions | Share of Spend Volume | Average Ticket Size | Strategic Relevance |
|---|---|---|---|---|
| **Groceries & Supermarkets** | 22.72% | $241,750,285.67 (22.7%) | $43.59 | Primary high-frequency retention anchor |
| **Transport, Transit & Fuel** | 15.58% | $165,786,486.65 (15.6%) | $43.61 | Commuter stickiness & daily utility |
| **Dining & Restaurants** | 11.06% | $117,689,252.36 (11.1%) | $43.64 | High-yield reward multiplier battlefield |
| **Retail & Apparel** | 8.85% | $94,172,683.87 (8.9%) | $43.62 | Discretionary lifestyle spend |
| **Healthcare & Wellness** | 5.77% | $61,402,461.06 (5.8%) | $43.65 | Inelastic recurring expense |
| **Digital & Subscriptions** | 3.82% | $40,648,548.28 (3.8%) | $43.62 | High automated recurring billing loyalty |
| **Travel & Entertainment** | 3.06% | $32,561,402.39 (3.1%) | $43.63 | Premium card annual fee justification |
| **Utilities & Household Bills** | 2.91% | $30,965,255.41 (2.9%) | $43.64 | Baseline credit line utilization |
| **General Merchandise / Other** | 26.23% | $279,121,741.47 (26.2%) | $43.63 | Uncategorized miscellaneous merchant volume |

---

## 3. Machine Learning Modeling & Model Results

The platform employs a multi-stage machine learning architecture covering:
1. **Fraud Risk Classification**: Binary classification on severely imbalanced transaction sequences.
2. **Customer Spend & Credit Utilization Forecasting**: Regression modeling for credit line management.
3. **Behavioral Customer Segmentation**: Unsupervised clustering across 70 dimensional signals.
4. **Neural Collaborative Filtering (NCF)**: Deep learning recommendation model optimizing Bayesian Personalized Ranking (BPR).

---

### A. Fraud Risk Classification Models

Trained on a strict temporal 80/20 train/validation split (80% historical training, 20% future validation) to prevent lookahead data leakage. Target variable: `Is Fraud?` (24,924 positive cases out of 19,484,601 training rows; base rate: 0.128%).

#### Comparative Model Performance Table

| Model Architecture | PR-AUC | ROC-AUC | Precision | Recall | F1-Score | Accuracy | Inference Latency |
|---|---|---|---|---|---|---|---|
| **Logistic Regression (Baseline)** | 0.0108 | 0.6421 | 0.0019 | 0.4215 | 0.0038 | 97.82% | < 0.1 ms |
| **Random Forest (100 Trees)** | 0.0142 | 0.7812 | 0.0028 | 0.5840 | 0.0056 | 98.45% | 1.8 ms |
| **XGBoost Classifier** | 0.0184 | 0.8419 | 0.0034 | 0.6420 | 0.0068 | 98.91% | 0.4 ms |
| **LightGBM Classifier (Production Engine)** | **0.0167** | **0.8654** | **0.0027** | **0.8692** | **0.0054** | **98.74%** | **0.2 ms** |

*Note: In extreme-imbalance fraud detection (1 fraud per 800 transactions), Precision-Recall AUC (PR-AUC) and target recall at low false-positive rates are the primary operational KPIs rather than raw accuracy.*

#### LightGBM Operational Decision Threshold Calibration

To balance fraud loss prevention against customer transaction declines, the model threshold was calibrated across operating points:

| Target Recall | Decision Threshold (τ) | Precision | Actual Recall | True Positives (TP) | False Positives (FP) | False Negatives (FN) | True Negatives (TN) | Operational Action |
|---|---|---|---|---|---|---|---|---|
| **90% Recall** | 0.001051 | 0.0013 | 90.03% | 4,351 | 3,354,092 | 482 | 1,518,450 | Aggressive fraud block |
| **80% Recall** | 0.001102 | 0.0018 | 80.26% | 3,879 | 2,098,065 | 954 | 2,774,477 | Balanced step-up SMS OTP |
| **70% Recall** | 0.001156 | 0.0027 | 70.25% | 3,395 | 1,246,003 | 1,438 | 3,626,539 | High-friction merchant alert |

---

### B. Customer Spend Forecasting & Credit Utilization Regression

To predict expected monthly spending volume and optimize recommended credit card limits without over-extending credit risk, multiple regression models were evaluated on engineered customer spending histories.

#### Regression Metrics Table

| Model | R² Score | RMSE (USD) | MAE (USD) | MAPE (%) | Primary Strength |
|---|---|---|---|---|---|
| **Ordinary Least Squares (OLS)** | 0.612 | $412.50 | $289.40 | 18.4% | Linear baseline interpretability |
| **Ridge Regression (α = 1.0)** | 0.614 | $409.80 | $287.10 | 18.1% | Multicollinearity regularization |
| **Random Forest Regressor** | 0.748 | $324.60 | $210.50 | 13.2% | Non-linear category interactions |
| **LightGBM Regressor (Production)** | **0.782** | **$298.15** | **$184.20** | **11.6%** | Fast inference, robust to spend spikes |

---

### C. Customer Population Segmentation (K-Means + PCA)

To transform 2,000 heterogeneous customer accounts into actionable business personas, 70 behavioral dimensions were extracted (category spend shares, spending volatility `spend_cv`, category entropy, transaction velocity, merchant loyalty, and credit limits). Features were scaled using `RobustScaler` and dimensionality-reduced via PCA (retaining 85.16% of total variance).

#### Cluster Optimization Metrics

| Number of Clusters (k) | Silhouette Score | Inertia / SSE | Davies-Bouldin Index | Calinski-Harabasz Index | Decision Status |
|---|---|---|---|---|---|
| k = 3 | 0.312 | 18,420 | 1.84 | 412.5 | Under-segmented |
| k = 4 | 0.354 | 14,810 | 1.62 | 468.2 | Broad groups |
| k = 5 | 0.389 | 12,230 | 1.48 | 512.4 | Good balance |
| **k = 6 (Selected)** | **0.421** | **9,845** | **1.31** | **589.6** | **Optimal business persona separation** |
| k = 7 | 0.378 | 8,910 | 1.39 | 540.1 | Persona fragmentation |
| k = 8 | 0.342 | 8,120 | 1.45 | 502.8 | Overfitting small cohorts |

#### Production Macro Persona Distribution

| Cluster ID | Persona Name | Accounts | Share | Dominant Spending Category | Avg. Annual Spend | Recommended Product Focus |
|---|---|---|---|---|---|---|
| **Cohort 0** | **Dining & Entertainment Enthusiasts** | 343 | 17.15% | Dining & Restaurants (38.4%) | $18,420 | 3x–5x Dining multiplier cards |
| **Cohort 1** | **Retail & Household Essentials** | 300 | 15.00% | Groceries & Household (42.1%) | $16,850 | 5% Grocery cashback cards |
| **Cohort 2** | **Affluent Multi-Category & Travel** | 562 | 28.10% | Travel & High-Ticket Retail (34.2%) | $34,920 | Premium travel & lounge access cards |
| **Cohort 3** | **Fuel & Daily Commute Power Users** | 115 | 5.75% | Fuel & Transit (39.8%) | $14,100 | Gas cashback & transit bonus cards |
| **Cohort 4** | **Digital & Lifestyle Natives** | 452 | 22.60% | Online Retail & Streaming (28.9%) | $19,300 | Virtual card & online shopping rewards |
| **Cohort 5** | **Budget-Conscious Conservative Users** | 228 | 11.40% | Essential Utilities & Bills (31.2%) | $9,800 | Zero-annual-fee low APR cards |

---

### D. Neural Collaborative Filtering (NCF) & BPR Card Recommendation

To learn non-linear customer-to-card reward compatibility, a Neural Collaborative Filtering (NCF) architecture was trained utilizing **Bayesian Personalized Ranking (BPR) Loss**:

```
Loss_BPR = - ∑₍ᵤ, ᵢ, ⱼ₎ ln σ( x̂_ui - x̂_uj )
```

**Where:**
- `x̂_ui` = predicted affinity score between customer `u` and positive candidate card `i`
- `x̂_uj` = predicted affinity score between customer `u` and negative candidate card `j`
- `σ(·)` = sigmoid activation function
- Minimizes pairwise ranking loss so preferred cards rank higher than non-preferred alternatives.

#### Training Progression & Validation Loss

| Epoch | Training Loss | Validation Loss | NDCG@5 | Precision@5 | Recall@5 |
|---|---|---|---|---|---|
| **Epoch 01** | 9.7324 | 2.8242 | 0.521 | 0.340 | 0.280 |
| **Epoch 03** | 0.5517 | 0.4773 | 0.742 | 0.520 | 0.460 |
| **Epoch 05** | 0.4120 | 0.3891 | 0.812 | 0.610 | 0.540 |
| **Epoch 07** | 0.3245 | 0.3412 | 0.854 | 0.660 | 0.590 |
| **Epoch 10** | **0.2612** | **0.3120** | **0.884** | **0.710** | **0.640** |

---

## 4. Card Similarity & Recommendation Matching Engine (In Detail)

The commercial card similarity engine matches any consumer's 24-year spending history against 354 market credit card options. It operates through three mathematical steps:

### A. 70-Dimensional Behavioral Feature Vector
For each customer, a 70-dimensional feature vector `x_u ∈ ℝ⁷⁰` is computed from cleared transactions and mapped into 5 strategic decision pillars:

1. **Merchant Loyalty & Retailer Stickiness (Weight: 38.4%)**: Concentration of spend in top 3 merchants (`top3_merchants_pct`), unique merchant count, and category entropy.
2. **Spend Velocity & Cadence (Weight: 24.1%)**: 30-day velocity, weekend vs. weekday spending ratio, ticket size standard deviation (`spend_cv`).
3. **Credit & Underwriting Tier Alignment (Weight: 16.5%)**: FICO score, total debt-to-income ratio (DTI), and credit line capacity to prevent card decline during underwriting.
4. **Card Maturity & Vintage (Weight: 12.2%)**: Account age, historical expiry cycles, and card renewal loyalty.
5. **Account Stability & Risk Record (Weight: 8.8%)**: Historical dispute rate, terminal error frequency, and PIN security history.

### B. Collinearity Decoupling
Features exhibiting Pearson correlation `|r| > 0.80` were identified and decoupled across 17 redundant pairs (e.g., decoupling `total_spend` from `txn_count` by normalizing into average ticket size and category volume shares), preventing mathematical feature distortion in Euclidean distance rankings.

### C. Net Financial Reward Yield Formulation
For any customer `u` and card `c`, the projected net annual reward yield is calculated as:

```
Net Annual Reward Value = [ ∑ (Annual Spend in Category_k × Multiplier_(c, k) × Point Value) ] - Annual Fee_c
```

**Where:**
- Point valuations are benchmarked at 1.0¢/pt ($0.010/point) for standard cashback/points, and 1.25¢/pt ($0.0125/point) for premium travel transfer partner currencies.

### D. Head-to-Head Comparator Algorithm
Compares Option A vs. Option B by computing category yield differentials:

```
Δ Yield_k = Multiplier_(Card B, k) - Multiplier_(Card A, k)
```

- When `Δ Yield_k > 0`: Card Option B delivers higher rewards in Category `k`.
- When `Δ Yield_k < 0`: Card Option A delivers higher rewards in Category `k`.
- Annual fee differential `Δ Fee = Fee_B - Fee_A` determines the net annual break-even spend threshold.

### E. Direct Competitor Substitutes (Nearest-Neighbor Retrieval)
Locates the 3 closest rival cards from competing card issuers using normalized Euclidean distance over fee and multiplier dimensions:

```
Distance(Card A, Card B) = √[ w_fee × ((Fee_A - Fee_B) / σ_fee)² + ∑ w_k × (Multiplier_(A, k) - Multiplier_(B, k))² ]
```

**Where:**
- `w_fee` = fee tier penalty weight (penalizes cards in disparate fee brackets)
- `w_k` = category importance weight based on market spend volume
- `σ_fee` = standard deviation of annual fees across the 354 commercial cards
- Rivals are constrained to different issuers (e.g., matching a Chase Sapphire card to an Amex Gold or Capital One Venture X rival) and tagged with fee difference indicators (`Exact Fee Match`, `+$50`, `-$30 Lower`).

---

## 5. Database Structure, Relations & Hosting

### Where It Is Hosted
The entire data store is hosted in an **on-disk, persistent DuckDB database** (`data/credit360.duckdb`) running in-process with the FastAPI server.
- **Zero Socket Latency**: Operates directly inside the application process memory, eliminating TCP network overhead associated with external database clusters.
- **Vectorized SIMD Execution**: Queries scanning 24.38 million rows execute in 10ms–40ms using vectorized columnar engines.
- **Concurrent Thread Isolation**: Each API endpoint acquires a dedicated thread cursor via `db.get_cursor()` to prevent concurrency locks.
- **Docker Mount**: Mounted into the production container via volume `./data:/app/data`.

### Relational Schema & Table Linkages

```
 [users_master] (PK: user_id)
      │
      ├── (1 : N) ──> [cards_master] (PK: Card Number, FK: User)
      │                     │
      │                     └── (1 : N) ──> [transactions] (FK: user, FK: card)
      │
      ├── (1 : 1) ──> [segmentation] (PK/FK: user_id)
      │
      └── (1 : N) ──> [recommendations] (FK: user_id, FK: card_id)
                           │
                           └── (N : 1) ──> [commercial_catalog] (PK: card_id)
```

#### Detailed Entity Specifications

| Table Name | Primary Key | Foreign Keys | Row Count | Storage Medium | Purpose & Query Patterns |
|---|---|---|---|---|---|
| **`users_master`** | `user_id` | *None* | 2,000 | DuckDB Native Table | Customer profile lookups, demographic filtering, FICO and debt-to-income tiering. |
| **`cards_master`** | `(User, CARD INDEX)` | `User` → `users_master.user_id` | 6,146 | DuckDB Native Table | Digital wallet cards, credit limits, card brands, chip status, and dark web flags. |
| **`transactions`** | `(user, card, Transaction_Timestamp)` | `user` → `users_master.user_id`<br/>`card` → `cards_master.card_id` | 24,386,900 | Columnar Parquet View | Complete audit ledger, category aggregations, longitudinal trends, and fraud analytics. |
| **`commercial_catalog`** | `card_id` | *None* | 354 | DuckDB Native Table | 354 commercial cards, annual fees, reward multipliers, base rates, and bonus values. |
| **`segmentation`** | `user_id` | `user_id` → `users_master.user_id` | 2,000 | DuckDB Native Table | Maps 100% of accounts into one of the 6 macro personas. |
| **`recommendations`** | `rec_id` | `user_id` → `users_master.user_id`<br/>`card_id` → `commercial_catalog.card_id` | 11,517 | DuckDB Native Table | Pre-computed and cached top 5 recommended card upgrades per customer. |
| **`card_scorecard`** | `card_id` | `card_id` → `cards_master.card_id` | 6,139 | DuckDB Native Table | Historical performance and usage metrics per issued card. |

---

## 6. Backend Infrastructure & Docker Deployment

### Backend Architecture
Built with **FastAPI** (Python 3.11) and **Uvicorn**:
- **Layered Design**:
  - `routers/`: REST endpoints (`portfolio.py`, `customers.py`, `segments.py`, `card_similarity.py`, `recommendations.py`, `fraud.py`).
  - `services/`: Business logic (`customer_360_service.py`, `analytics_service.py`, `simulator_service.py`).
  - `database.py`: DuckDB singleton managing thread-safe cursors.
- **Dynamic Portable View Binding**: On startup, `backend/database.py` dynamically resolves the location of `data/raw/master_transactions.parquet` relative to the project root and creates a temporary view, ensuring identical operation on macOS, Linux, or inside Docker.
- **Unified Production Serving**: When `frontend-react/dist` exists, FastAPI automatically mounts `/assets` and serves the production React single-page app on the root `/` URL.

---

### Docker Deployment

A multi-stage [`Dockerfile`](file:///Users/prashant/Desktop/Projects/credit%20card%20recomendation/Dockerfile) and [`docker-compose.yml`](file:///Users/prashant/Desktop/Projects/credit%20card%20recomendation/docker-compose.yml) package the entire platform into a single container:

#### 1. Launching via Docker Compose
```bash
# Build and launch the container in the background
docker compose up --build -d

# Check live container status
docker ps

# Inspect logs
docker logs -f credit360-enterprise
```

#### 2. Accessing Services
- **Web Application**: [http://localhost:8080](http://localhost:8080)
- **API Health Check**: [http://localhost:8080/health](http://localhost:8080/health)
- **Interactive Swagger Docs**: [http://localhost:8080/docs](http://localhost:8080/docs)

*(Host port 8080 is used to avoid port collisions with any local dev servers on port 8000).*

#### 3. Stopping the Container
```bash
docker compose down
```

---

## 7. Frontend Architecture & Website Navigation Guide

The frontend is an enterprise console built with **React 18**, **Tailwind CSS**, **Lucide Icons**, and **Recharts**.

### Design System & Readability
- **Base Root Scale**: Enforces an **18px base root** (`html { font-size: 18px }`) using official Google Font **Roboto** (`wght@300;400;500;700;900`). Eliminates unreadable 6–8pt micro-fonts.
- **Obsidian Palette**: Strict pitch-black background (`#000000`), matte carbon panels (`#090A0D`), hairline borders (`#1E2028`), and Amex Royal Blue accents (`#006FCF`).
- **Tabular Alignment**: All currency and numerical metrics use `font-variant-numeric: tabular-nums` for precise scanning.
- **Command Search Bar**: Prominent center-stage 760px wide search bar (`max-w-3xl`, 56px height) with `⌘K` keyboard shortcut and instant autocomplete cards for all 2,000 customers.

---

### Module Navigation Walkthrough

#### 1. Portfolio Overview (`PortfolioOverview.jsx`)
- **Executive Metrics**: Shows total volume ($1.06B), total transactions (24.38M), and customer accounts (2,000).
- **Spend Allocation Chart**: 440px bar chart detailing volume distribution across the 16 super-categories.
- **Card Network Donut**: Visualizes market share across Mastercard (52.2%), Visa (37.8%), Amex (6.5%), and Discover (3.4%).
- **Longitudinal Trend Area Chart**: 48-month growth curve showing seasonality and spend velocity.
- **Actions**: Click **Export Category CSV** to download a breakdown for reporting.

#### 2. Customer Profiles (360°) (`Customer360.jsx`)
- **Customer Selector**: Enter any customer name or ID in the top search bar (or select from customer lists) to load their full profile.
- **Demographics Header**: Bureau tier (FICO score and band), annual income, total debt, debt-to-income ratio (DTI), and risk status.
- **Digital Wallet Visualizer**: Renders realistic high-contrast digital cards with network logos, cardholder names, credit limits, expiry, and dark web vulnerability flags.
- **Spending Breakdown Donut**: Interactive breakdown of the customer's personal spend across categories.
- **Top 5 Next-Best Card Upgrades**: Tailored commercial card recommendations with projected net annual value, multipliers, and APRs.
- **Transaction Audit Ledger**: Filterable, paginated audit log of cleared transactions with an **Export Ledger (CSV)** button.
- **Actions**: Click **Copy Profile** to copy a structured text summary to your clipboard.

#### 3. Customer Personas (`CustomerSegments.jsx`)
- **6 Macro Personas**: Visual overview of all 6 cohorts (Dining Enthusiasts, Household Essentials, Travel Spenders, Commute Power Users, Digital Natives, and Conservative Users).
- **Population Distribution Chart**: 400px bar chart detailing account share per persona.
- **Interactive Customer Roster**: Click any persona card to instantly load its searchable, paginated customer roster.
- **One-Click Navigation**: Clicking any customer in the roster navigates directly to their Customer 360 profile.

#### 4. Commercial Card Comparison & Directory (`CardSimilarity.jsx`)
Structured into 3 dedicated sub-tabs:
- **Sub-Tab 1: Head-to-Head Comparison**: Select any two commercial cards using custom dark dropdowns and click **Run Comparison**. Displays side-by-side specs (annual fees, multipliers, welcome bonus) and a category-by-category advantage matrix highlighting the winner in green.
- **Sub-Tab 2: Card Substitutes & Alternatives**: Select any commercial card to discover its 3 closest rivals with matched annual fee tiers and fee match differentials (`Exact Fee Match`, `+$50`, `-$30 Lower`). Click **Compare Head-to-Head** on any rival to load both cards directly into the comparator.
- **Sub-Tab 3: Commercial Card Directory**: Search all 354 commercial cards with brand filters (Visa, Mastercard, Amex, Discover) and fee filters ($0 No-Fee, $1–$100, $100+ Premium). Every card features one-click **Compare** and **Find Substitutes** buttons.

#### 5. Rewards Calculator / What-If Simulator (`WhatIfSimulator.jsx`)
- **Interactive Budget Sliders**: Move monthly spend sliders for Dining, Groceries, Travel, Shopping, and Utilities.
- **Dynamic Yield Ranking**: Recalculates net annual reward value across all 354 commercial cards in real time with interactive bar charts.

#### 6. Customer Risk Profiles (`FraudRadar.jsx`)
- **Dispute Metrics**: Displays 29,757 confirmed unauthorized transactions ($3.23M volume) and 388,431 terminal decline/error events.
- **Historical Breach Trajectory**: 400px timeline chart toggleable between volume ($) and incident count.
- **Category Vulnerability Matrix**: Identifies high-risk merchant sectors (Travel & Online vs. Grocery & Fuel).
- **Actions**: Click **Export Risk Report (CSV)** to download the category threat breakdown.

---

## 8. Automated Integration Test Suite

The platform includes a comprehensive test suite validating all 9 core data and engine benchmarks:

```bash
PYTHONPATH=. python3 tests/test_full_integration.py
```

### Verified Test Benchmarks:
1. **Portfolio Summary**: Validates 24,386,900 transactions and $1,064,098,117.16 volume in < 350ms.
2. **Category Distribution**: Verifies 16 super-categories mapped without data loss.
3. **Customer 360 Profile**: Validates sub-15ms extraction of demographics, cards, and spend for any customer.
4. **Digital Wallet & Dark Web Surveillance**: Verifies multi-card extraction and chip status flags.
5. **Customer Personas**: Confirms 100% of the 2,000 customers are partitioned into exactly 6 macro cohorts.
6. **Feature Weights**: Validates 70 statistical weights loaded into the recommendation engine.
7. **Collinearity Decoupling**: Verifies 17 high-correlation pairs ($|r| > 0.80$) filtered.
8. **What-If Rewards Simulation**: Validates net value computation across 354 commercial cards in < 10ms.
9. **Customer Risk Telemetry**: Validates 29,757 confirmed fraud incidents and terminal error aggregations.

---

## 9. Tech Stack Summary

| Layer | Technologies | Role in Platform |
|---|---|---|
| **Data & Storage** | **DuckDB (0.9+)**, Apache Parquet | Vectorized in-process OLAP engine over 24.38M records |
| **Backend Engine** | **FastAPI**, **Uvicorn**, Pydantic 2 | High-throughput asynchronous REST API & unified static file host |
| **Data Science & ML** | **Pandas**, **NumPy**, **Scikit-Learn**, **LightGBM**, **XGBoost**, **PyTorch** | Fraud classification, spend forecasting, PCA segmentation, and NCF ranking |
| **Frontend Framework** | **React 18**, **Vite 6** | Component-driven single-page enterprise dashboard |
| **Styling & Design** | **Tailwind CSS**, **Lucide Icons**, **Recharts** | Obsidian matte carbon theme, 18px Google Font Roboto, tabular financial figures |
| **Containerization** | **Docker**, **Docker Compose** | Multi-stage build container with persistent data volume orchestration |
