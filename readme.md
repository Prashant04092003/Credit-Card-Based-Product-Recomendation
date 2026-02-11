# Credit Card Based Product Recommendation System

An end-to-end Credit Card Intelligence Pipeline covering:

1. Fraud Detection (Transaction-Level Risk Modeling)  
2. Customer Segmentation (User-Level Behavioral Clustering)  
3. Credit Card Recommendation System (Hybrid Neural Ranking Model)  

This project simulates a production-grade banking system where risk, behavior, and product alignment are integrated into a single scalable framework.

---

# 1. Fraud Detection Module

## Overview

The Fraud Detection module operates at the **transaction level** and identifies anomalous credit card activity under extreme class imbalance and real-world operational constraints.

Rather than relying on raw transaction attributes, the model captures **behavioral deviations**, which are central to modern fraud detection systems.

---

## Feature Engineering Strategy

Fraud detection is driven by historical behavioral features, including:

- Transaction velocity (transactions in last 1h / 24h)
- Temporal gaps between transactions
- Deviation from user spending baseline
- First-time merchant and MCC indicators
- Time-of-day and channel usage patterns

These features model behavioral change instead of static transaction characteristics.

---

## Model: LightGBM Classifier

A **LightGBM classifier** serves as the primary fraud engine due to:

- Strong performance on tabular financial data
- Ability to model non-linear interactions
- Scalability to millions of transactions
- Interpretability for compliance and audit use cases

The model outputs a continuous fraud risk score, which is mapped into business risk bands:

- Low  
- Medium  
- High  
- Critical  

Each band corresponds to operational actions:

- Approve  
- Monitor  
- OTP Verification  
- Decline  

---

## Graph-Based Exploration

An experimental **Graph Neural Network (GNN)** was implemented on high-risk subsets to explore relational fraud propagation patterns.

This acts as an enrichment layer rather than the core production model.

---

## Fraud Output Artifact

Final transaction-level output includes:

- `fraud_score`
- `fraud_band`
- `fraud_action`

This artifact feeds downstream segmentation and recommendation modules, ensuring risk-aware growth decisions.

---

# 2. Customer Segmentation (User-Level Behavioral Modeling)

## Objective

The goal of segmentation is to group customers based on:

- Behavioral spending patterns  
- Credit capacity  
- Aggregated risk signals  

Segmentation is performed at the **user level**, since business decisions are customer-centric.

---

## Why User-Level Segmentation?

- Transaction-level clustering is unstable and noisy  
- Card-level clustering fragments multi-card customers  

Instead, transaction data, card data, and fraud signals are aggregated into a **single user-level feature table (1 row per user).**

---

## Feature Engineering

### Behavioral Spending Features

Transactions are mapped via MCC codes into nine business categories:

- Groceries  
- Dining & Food  
- Transport & Fuel  
- Retail & Apparel  
- Healthcare & Wellness  
- Utilities & Bills  
- Digital Subscriptions  
- Entertainment & Leisure  
- Travel & Lodging  

For each user, the following metrics are computed:

- `txn_count`
- `total_spend`
- `avg_txn_amount`
- `spend_cv` (volatility)
- `category_entropy` (diversification)
- `share_<category>` (category spend share)

These features represent lifestyle intensity and preference structure.

---

### Credit Capacity Features

From card portfolio data:

- `num_cards`
- `total_credit_limit`
- `avg_credit_limit`

These describe exposure and financial maturity.

---

### Aggregated Risk Signals

Fraud signals are safely aggregated per user:

- `avg_fraud_score`
- `% high-risk`
- `% critical-risk`

Risk is treated as a behavioral trait, not a filtering condition.

---

### Why FICO Was Excluded from Clustering

FICO score was intentionally excluded because:

- It is a policy variable, not behavioral
- It would dominate cluster formation
- It is reserved for eligibility gating in recommendations

---

## Clustering Model

### Rejected Approach: K-Means

K-Means was discarded due to:

- Instability across runs
- Sensitivity to heavy-tailed financial features
- Hard cluster boundaries
- Poor handling of compositional spending shares

---

### Final Model: Gaussian Mixture Model (GMM)

Gaussian Mixture Models were selected because they:

- Provide soft (probabilistic) cluster membership  
- Handle non-spherical cluster shapes  
- Model covariance between features  
- Represent overlapping lifestyle patterns  

---

## Cluster Selection

The number of clusters was selected using **Bayesian Information Criterion (BIC)** to balance fit and complexity.

Final choice:

**k = 7 clusters**

---

## Resulting Personas

Seven interpretable behavioral segments were identified, including:

- Retail-Centric Lifestyle Spenders  
- Dining & Convenience Seekers  
- Fuel & Commute Heavy Users  
- Digital & Subscription Natives  
- Travel & Experience Spenders  
- Budget-Conscious Essentials Users  
- High-Capacity Risk-Edge Users  

Each persona reflects a combination of:

- Spending intensity  
- Lifestyle preference  
- Credit capacity  
- Risk exposure  

---

## Segmentation Output Artifact

`user_level_segmentation_features.csv`

Characteristics:

- One row per user  
- All engineered behavioral features  
- Cluster and persona labels  
- FICO included for downstream eligibility logic  

This file serves as the single source of truth for recommendation modeling.

---

# 3. Credit Card Recommendation System

## Overview

The Recommendation System is the final stage of the pipeline.

It recommends credit cards based on:

- Behavioral spending patterns  
- Credit capacity and FICO score  
- Aggregated fraud risk  
- Cluster persona alignment  
- Card reward structure and eligibility  

The system uses a **Hybrid Neural Collaborative Filtering (Hybrid NCF)** architecture.

---

## Key Challenges

- No historical user–card interaction labels  
- High-dimensional behavioral features  
- Strict eligibility constraints  
- Need for interpretability  
- Cold-start stability  

---

## Data Inputs

### 1. User-Level Features

`user_recommendation.csv`

Contains:

- Spending aggregates  
- Category shares  
- Spending entropy  
- Credit capacity features  
- Fraud aggregates  
- FICO score  
- Cluster ID  

---

### 2. Card Master Table

`card_master_table.csv`

Includes:

- Card ID  
- Brand and tier  
- Annual fee and APR  
- Reward structure  
- FICO eligibility range  
- Cluster alignment metadata  

---

### 3. Pairwise Training Data

`pairwise_training_data.csv`

Contains:

- `user_id`
- `pos_card_id`
- `neg_card_id`

Generated using compatibility scoring.

---

## Weak Supervision Framework

Since no historical labels exist:

1. Compatibility scores are generated using:
   - Reward alignment  
   - Category match  
   - Risk penalty  
   - Cluster alignment  
   - FICO eligibility  

2. Scores are converted into pairwise ranking tuples:
   `(user, preferred_card, less_preferred_card)`

This enables learning relative preferences.

---

## Model Architecture: Hybrid Neural Collaborative Filtering

The architecture combines:

### Latent Embeddings
- User embedding  
- Card embedding  

### Explicit Feature Encoders
- MLP for user features  
- MLP for card features  

### Interaction Network
Concatenated representations are passed through an MLP to produce:

`score(user, card)`

---

## Training Strategy

The model is trained using:

- Pairwise ranking objective  
- Bayesian Personalized Ranking (BPR) loss  

Loss:

L = -log(sigmoid(score_pos - score_neg))

Users are split at the user level to prevent data leakage.

---

## Evaluation Metrics

- NDCG@K  
- Ranking consistency across validation users  

Loss alone is not used to judge model quality.

---

## Inference Pipeline

For each user:

1. Filter eligible cards using FICO and policy rules  
2. Score all eligible cards  
3. Apply risk-aware penalty  
4. Optionally enforce diversity constraint  
5. Return Top-10 ranked cards  

Final output includes:

- `user_id`
- `cluster`
- `persona`
- `rank`
- `card_id`
- `card_name`
- `brand`
- `card_tier`
- `annual_fee`
- `apr`
- `final_score`

---

## Explainability

Recommendations are explainable through:

- Persona alignment  
- Reward-category matching  
- Risk transparency  
- Cluster-based reasoning  

---

# Final Summary

The Credit Card Based Product Recommendation System:

- Detects fraud using behavioral modeling  
- Segments customers using probabilistic clustering  
- Recommends products using Hybrid Neural Collaborative Filtering  
- Enforces eligibility and risk constraints  
- Maintains interpretability and production realism  

This project simulates a real-world banking intelligence pipeline from raw transaction data to deployable recommendation output.
