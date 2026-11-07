"""
scripts/setup_duckdb.py
=======================
Initializes and builds the persistent DuckDB database (data/credit360.duckdb)
for the Credit Card Intelligence Platform.

Tables / Views Configured:
1. transactions       : 24,386,900 rows (from master_transactions.parquet with ground-truth is_fraud)
2. users_master       : 2,000 rows (from users_master.csv)
3. cards_master       : 6,146 rows (from cards_master.csv merged with dark web flags from cards.csv)
4. segmentation       : 2,000 rows (from segmentation.csv)
5. card_scorecard     : 6,139 rows (from card_scorecard_v1.csv)
6. recommendations    : 11,517 rows (from recommendations.csv)
7. card_master        : 14 rows (from card_master_table.csv)
8. commercial_catalog : 354 rows (from commercial_canonical_feature_matrix_v1.csv)
"""

import os
import sys
import time
from pathlib import Path
import duckdb

# Determine project root
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"
DB_PATH = BASE_DIR / "data" / "credit360.duckdb"

print("=" * 65)
print("CREDIT360 DUCKDB DATABASE INITIALIZATION")
print("=" * 65)
print(f"Target Database File : {DB_PATH}")
print(f"Source Data Folder   : {DATA_DIR}")
print("-" * 65)

# Ensure data directory exists
os.makedirs(DB_PATH.parent, exist_ok=True)

# Remove existing database file if recreating cleanly
if DB_PATH.exists():
    print(f"Replacing existing database at {DB_PATH.name}...")
    try:
        os.remove(DB_PATH)
    except Exception as e:
        print(f"Note: Could not remove old db file ({e}), connecting directly.")

t_total_start = time.time()
con = duckdb.connect(str(DB_PATH))

# -------------------------------------------------------------
# 1. TRANSACTIONS (24,386,900 rows via Parquet View)
# -------------------------------------------------------------
t0 = time.time()
parquet_path = DATA_DIR / "master_transactions.parquet"
if not parquet_path.exists():
    raise FileNotFoundError(f"Parquet file not found at: {parquet_path}")

con.execute(f"""
    CREATE OR REPLACE VIEW transactions AS 
    SELECT * FROM '{parquet_path}'
""")
t_tx = time.time() - t0
tx_count = con.execute("SELECT count(*) FROM transactions").fetchone()[0]
print(f"✓ View 'transactions' created: {tx_count:,} rows (took {t_tx:.3f}s)")

# -------------------------------------------------------------
# 2. USERS MASTER (2,000 rows)
# -------------------------------------------------------------
t0 = time.time()
users_path = DATA_DIR / "users_master.csv"
con.execute(f"""
    CREATE OR REPLACE TABLE users_master AS 
    SELECT * FROM read_csv_auto('{users_path}')
""")
users_count = con.execute("SELECT count(*) FROM users_master").fetchone()[0]
print(f"✓ Table 'users_master' created: {users_count:,} rows (took {time.time()-t0:.3f}s)")

# -------------------------------------------------------------
# 3. CARDS MASTER (6,146 rows + Dark Web security flags)
# -------------------------------------------------------------
t0 = time.time()
cards_path = DATA_DIR / "cards_master.csv"
cards_raw_path = DATA_DIR / "cards.csv"

con.execute(f"""
    CREATE OR REPLACE TABLE cards_master AS 
    SELECT 
        cm.*,
        cr."Card on Dark Web" as card_on_dark_web
    FROM read_csv_auto('{cards_path}') cm
    LEFT JOIN read_csv_auto('{cards_raw_path}') cr
        ON cm.user = cr."User" AND cm.card_index = cr."CARD INDEX"
""")
cards_count = con.execute("SELECT count(*) FROM cards_master").fetchone()[0]
print(f"✓ Table 'cards_master' created: {cards_count:,} rows (took {time.time()-t0:.3f}s)")

# -------------------------------------------------------------
# 4. SEGMENTATION & PERSONAS (2,000 rows)
# -------------------------------------------------------------
t0 = time.time()
seg_path = DATA_DIR / "segmentation.csv"
con.execute(f"""
    CREATE OR REPLACE TABLE segmentation AS 
    SELECT * FROM read_csv_auto('{seg_path}')
""")
seg_count = con.execute("SELECT count(*) FROM segmentation").fetchone()[0]
print(f"✓ Table 'segmentation' created: {seg_count:,} rows (took {time.time()-t0:.3f}s)")

# -------------------------------------------------------------
# 5. CARD SCORECARD (6,139 rows × 84 metrics)
# -------------------------------------------------------------
t0 = time.time()
scorecard_path = DATA_DIR / "card_scorecard_v1.csv"
con.execute(f"""
    CREATE OR REPLACE TABLE card_scorecard AS 
    SELECT * FROM read_csv_auto('{scorecard_path}')
""")
sc_count = con.execute("SELECT count(*) FROM card_scorecard").fetchone()[0]
print(f"✓ Table 'card_scorecard' created: {sc_count:,} rows (took {time.time()-t0:.3f}s)")

# -------------------------------------------------------------
# 6. RECOMMENDATIONS (11,517 rows)
# -------------------------------------------------------------
t0 = time.time()
reco_path = DATA_DIR / "recommendations.csv"
con.execute(f"""
    CREATE OR REPLACE TABLE recommendations AS 
    SELECT * FROM read_csv_auto('{reco_path}')
""")
reco_count = con.execute("SELECT count(*) FROM recommendations").fetchone()[0]
print(f"✓ Table 'recommendations' created: {reco_count:,} rows (took {time.time()-t0:.3f}s)")

# -------------------------------------------------------------
# 7. CARD MASTER TABLE (14 reference cards)
# -------------------------------------------------------------
t0 = time.time()
cm_path = DATA_DIR / "card_master_table.csv"
con.execute(f"""
    CREATE OR REPLACE TABLE card_master AS 
    SELECT * FROM read_csv_auto('{cm_path}')
""")
cm_count = con.execute("SELECT count(*) FROM card_master").fetchone()[0]
print(f"✓ Table 'card_master' created: {cm_count:,} rows (took {time.time()-t0:.3f}s)")

# -------------------------------------------------------------
# 8. COMMERCIAL CATALOG (354 commercial cards + metadata)
# -------------------------------------------------------------
t0 = time.time()
comm_feat_path = DATA_DIR / "commercial_canonical_feature_matrix_v1.csv"
comm_meta_path = DATA_DIR / "commercial_cards_metadata_clean.csv"

# Load both, add card_id index, and merge
import pandas as pd
df_feat = pd.read_csv(comm_feat_path)
df_meta = pd.read_csv(comm_meta_path)

df_feat["card_id"] = df_feat.index
df_feat["card_name"] = df_meta["card_name"]
df_feat["issuer_name"] = df_meta["issuer_name"]
df_feat["slug"] = df_meta["slug"]

con.register("df_commercial_merged", df_feat)
con.execute("""
    CREATE OR REPLACE TABLE commercial_catalog AS 
    SELECT * FROM df_commercial_merged
""")
comm_count = con.execute("SELECT count(*) FROM commercial_catalog").fetchone()[0]
print(f"✓ Table 'commercial_catalog' created: {comm_count:,} rows (took {time.time()-t0:.3f}s)")

print("-" * 65)
print(f"All 8 tables/views successfully built in {time.time()-t_total_start:.2f}s!")
print("-" * 65)

# -------------------------------------------------------------
# VERIFICATION & BENCHMARK SUITE
# -------------------------------------------------------------
print("RUNNING BENCHMARK VERIFICATION:")

# 1. Macro KPIs across 24.38M transactions
t0 = time.time()
kpi = con.execute("""
    SELECT 
        count(*) as total_txns,
        round(sum(amount), 2) as total_volume,
        sum(case when is_fraud = 1 then 1 else 0 end) as fraud_cases
    FROM transactions
""").fetchone()
print(f"1. 24.38M Scan (Full Table) : {kpi[0]:,} txns | ${kpi[1]:,.2f} vol | {kpi[2]:,} fraud cases (took {time.time()-t0:.3f}s)")

# 2. Customer 360 Join Test (User 0 across 4 tables)
t0 = time.time()
c360_test = con.execute("""
    SELECT 
        u.person,
        u.fico_score,
        s.cluster,
        count(distinct t.merchant_name) as unique_merchants,
        round(sum(t.amount), 2) as user_total_spend
    FROM users_master u
    JOIN segmentation s ON u.user_id = s.User
    JOIN transactions t ON u.user_id = t.user
    WHERE u.user_id = 0
    GROUP BY u.person, u.fico_score, s.cluster
""").fetchone()
print(f"2. Customer 360 Multi-Join  : {c360_test[0]} | FICO: {c360_test[1]} | Cluster: {c360_test[2]} | Spend: ${c360_test[4]:,.2f} (took {time.time()-t0:.3f}s)")

# 3. Top 3 Categories for User 0
t0 = time.time()
top_cats = con.execute("""
    SELECT super_category, round(sum(amount), 2) as spend
    FROM transactions
    WHERE user = 0
    GROUP BY super_category
    ORDER BY spend DESC
    LIMIT 3
""").fetchall()
print(f"3. Top Categories Query     : {[c[0] + ' ($' + str(c[1]) + ')' for c in top_cats]} (took {time.time()-t0:.3f}s)")

con.close()
print("=" * 65)
print("DUCKDB SETUP COMPLETE AND READY FOR USE!")
print("=" * 65)

