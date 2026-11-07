import time
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

print("="*65)
print("TESTING FASTAPI ENDPOINTS WITH DUCKDB ENGINE")
print("="*65)

# 1. Health / Root
res = client.get("/")
assert res.status_code == 200, res.text
print("✓ Root & Health Check:", res.json()["message"])

# 2. Portfolio Summary
t0 = time.time()
res = client.get("/api/portfolio/summary")
assert res.status_code == 200, res.text
kpis = res.json()["data"]["kpis"]
print(f"✓ Portfolio Summary (took {time.time()-t0:.3f}s): {kpis['total_transactions']:,} txns | ${kpis['total_spend_volume']:,.2f}")

# 3. Customer List
t0 = time.time()
res = client.get("/api/customers/?limit=5")
assert res.status_code == 200, res.text
data = res.json()
print(f"✓ Customer List (took {time.time()-t0:.3f}s): Total {data['pagination']['total_records']} customers | First: {data['data'][0]['person']}")

# 4. Customer 360 Dossier
t0 = time.time()
res = client.get("/api/customers/0/360")
assert res.status_code == 200, res.text
c360 = res.json()["data"]
print(f"✓ Customer 360 for User 0 (took {time.time()-t0:.3f}s): {c360['demographics']['person']} | FICO: {c360['demographics']['fico_score']} | Risk: {c360['risk_profile']['risk_band']} | Top Card: {c360['top_recommendations'][0]['card_name']}")

# 5. Customer Cards Detail
t0 = time.time()
res = client.get("/api/customers/0/cards")
assert res.status_code == 200, res.text
cards = res.json()
print(f"✓ Customer Cards for User 0 (took {time.time()-t0:.3f}s): {cards['total_cards']} cards | Most Used: Card {cards['most_used_card_index']}")

# 6. Customer Live Transactions
t0 = time.time()
res = client.get("/api/customers/0/transactions?limit=3")
assert res.status_code == 200, res.text
txns = res.json()
print(f"✓ Customer Transactions for User 0 (took {time.time()-t0:.3f}s): Retrieved {txns['count']} transactions")

# 7. Customer Segments Overview
t0 = time.time()
res = client.get("/api/segments/")
assert res.status_code == 200, res.text
segs = res.json()
print(f"✓ Segments Overview (took {time.time()-t0:.3f}s): {segs['total_segments']} personas | Top: {segs['data'][0]['persona_name']}")

# 8. Card Similarity Weights
t0 = time.time()
res = client.get("/api/cards/similarity/weights")
assert res.status_code == 200, res.text
weights = res.json()
print(f"✓ Similarity Weights (took {time.time()-t0:.3f}s): {weights['total_features']} features | Top: {weights['data'][0]['Feature']} ({weights['data'][0]['Feature_Weight']})")

# 9. Recommendations Overview
t0 = time.time()
res = client.get("/api/recommendations/overview")
assert res.status_code == 200, res.text
recos = res.json()
print(f"✓ Recommendations Overview (took {time.time()-t0:.3f}s): {recos['kpis']['users_with_recommendations']} users covered | Top: {recos['top_recommended_cards'][0]['card_name']}")

# 10. What-If Simulation
t0 = time.time()
sim_payload = {
    "monthly_spend": {
        "Dining": 500.0,
        "Groceries": 700.0,
        "Travel": 400.0,
        "Shopping": 600.0
    },
    "max_annual_fee": 250.0,
    "preferred_brand": "All"
}
res = client.post("/api/recommendations/simulate", json=sim_payload)
assert res.status_code == 200, res.text
sim = res.json()["data"]
print(f"✓ What-If Simulator (took {time.time()-t0:.3f}s): Top Card = {sim['top_recommended_cards'][0]['card_name']} (Net Value: ${sim['top_recommended_cards'][0]['net_annual_value']})")

# 11. Fraud Overview
t0 = time.time()
res = client.get("/api/fraud/overview")
assert res.status_code == 200, res.text
fraud = res.json()["kpis"]
print(f"✓ Fraud Overview (took {time.time()-t0:.3f}s): {fraud['confirmed_fraud_transactions']:,} fraud cases | Rate: {fraud['overall_fraud_rate_pct']}%")

print("="*65)
print("ALL 11 ENDPOINTS VERIFIED & WORKING PERFECTLY!")
print("="*65)

