# data/schemas.py

# ======================
# USERS (1 row per user)
# ======================
USERS_COLUMNS = [
    "Person",                 # user identifier
    "Current Age",
    "Gender",
    "City",
    "State",
    "Per Capita Income - Zipcode",
    "Yearly Income - Person",
    "Total Debt",
    "FICO Score",
    "Num Credit Cards"
]

# ======================
# FRAUD (transaction-level, banded)
# ======================
FRAUD_COLUMNS = [
    "User",
    "Year",
    "Month",
    "Day",
    "Time",
    "fraud_band",
    "Merchant Name",
    "is_new_merchant_for_user",
    "is_new_mcc_for_user"
]

# ======================
# SEGMENTATION (1 row per user)
# ======================
SEGMENTATION_COLUMNS = [
    "User",
    "cluster",
    "txn_count",
    "total_spend",
    "avg_txn_amount",
    "spend_cv",
    "category_entropy",
    "share_Groceries",
    "share_Dining_Food",
    "share_Transport_Fuel",
    "share_Retail_Apparel",
    "share_Healthcare_Wellness",
    "share_Utilities_Bills",
    "share_Digital_Subscriptions",
    "share_Travel_Lodging",
    "share_Entertainment_Leisure",
    "num_cards",
    "total_credit_limit",
    "avg_credit_limit",
    "pct_high",
    "pct_critical"
]

# ======================
# USER-OWNED CARDS
# ======================
CARDS_COLUMNS = [
    "User",
    "Card Brand",
    "Card Type",
    "Cards Issued",
    "Credit Limit",
    "Has Chip"
]

# ======================
# RECOMMENDATIONS
# ======================
RECOMMENDATIONS_COLUMNS = [
    "user_id",
    "cluster",
    "rank",
    "card_id",
    "card_name",
    "brand",
    "card_tier",
    "annual_fee",
    "apr",
    "final_score",
    "cluster_id",
    "persona"
]

# ======================
# CARD MASTER / CATALOG
# ======================
CARD_MASTER_COLUMNS = [
    "card_id",
    "card_name",
    "brand",
    "card_tier",
    "annual_fee",
    "apr",
    "min_fico",
    "max_fico",
    "reward_grocery",
    "reward_dining",
    "reward_fuel",
    "reward_travel",
    "reward_retail",
    "reward_digital",
    "reward_other"
]