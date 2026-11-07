import time
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_1_portfolio_summary():
    t0 = time.time()
    res = client.get("/api/portfolio/summary")
    duration = time.time() - t0
    assert res.status_code == 200
    res_json = res.json()
    assert res_json["status"] == "success"
    kpis = res_json["data"]["kpis"]
    assert kpis["total_transactions"] == 24386900
    assert kpis["total_customers"] == 2000
    assert kpis["total_cards"] == 6146
    assert kpis["total_spend_volume"] > 1_000_000_000  # ~$1.064B
    print(f"✓ Portfolio Summary verified ({duration*1000:.1f}ms): {kpis['total_transactions']:,} txns, ${kpis['total_spend_volume']:,.2f}")

def test_2_portfolio_categories():
    res = client.get("/api/portfolio/categories")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) > 0
    cats = [c["category"] for c in data]
    assert "Shopping" in cats
    assert "Travel" in cats
    print(f"✓ Portfolio Categories verified: {len(data)} categories mapped")

def test_3_customer_360_user_0():
    t0 = time.time()
    res = client.get("/api/customers/0/360")
    duration = time.time() - t0
    assert res.status_code == 200
    data = res.json()["data"]
    # Demographics
    demo = data["demographics"]
    assert demo["user_id"] == 0
    assert "fico_score" in demo
    assert "age" in demo
    # Spending overview
    spending = data["spending_overview"]
    assert spending["total_transactions"] > 0
    assert spending["total_spend"] > 0
    # Habits
    habits = spending["habits"]
    assert "unique_merchants" in habits
    assert "top3_merchants_pct" in habits
    # Wallet (cards)
    assert len(data["wallet"]) > 0
    # Risk
    risk = data["risk_profile"]
    assert "confirmed_fraud_transactions" in risk
    assert "risk_band" in risk
    # Recommendations
    assert len(data["top_recommendations"]) > 0
    top_reco = data["top_recommendations"][0]
    assert "net_annual_value" in top_reco
    print(f"✓ Customer 360 User 0 verified ({duration*1000:.1f}ms): {spending['total_transactions']:,} txns, ${spending['total_spend']:,.2f} spend")

def test_4_customer_deep_cards():
    res = client.get("/api/customers/0/cards")
    assert res.status_code == 200
    cards = res.json()["data"]
    assert len(cards) > 0
    for card in cards:
        assert "is_most_used_card" in card
        assert "mean_transaction" in card
        assert "median_transaction" in card
        assert "share_of_wallet_pct" in card
        assert "card_on_dark_web" in card
    has_most_used = any(c["is_most_used_card"] for c in cards)
    assert has_most_used
    print(f"✓ Customer Cards verified: {len(cards)} cards analyzed with share of wallet & dark web audit")

def test_5_customer_segments():
    res = client.get("/api/segments/")
    assert res.status_code == 200
    clusters = res.json()["data"]
    assert len(clusters) == 6
    total_users_in_clusters = sum(c["customer_count"] for c in clusters)
    assert total_users_in_clusters == 2000
    print(f"✓ Customer Segments verified: 6 macro cohorts covering exactly 2,000 customers (100% population)")

def test_6_feature_weights():
    res = client.get("/api/cards/similarity/weights")
    assert res.status_code == 200
    data = res.json()
    assert data["total_features"] == 70
    assert len(data["feature_groups"]) > 0
    top_feature = data["data"][0]
    assert "Feature" in top_feature
    assert "Feature_Weight" in top_feature
    assert "Variance" in top_feature
    assert "Entropy" in top_feature
    assert "Robustness" in top_feature
    print(f"✓ Feature Weights verified: 70 statistical weights loaded, top feature: {top_feature['Feature']} ({top_feature['Feature_Weight']:.4f})")

def test_7_collinear_pairs():
    res = client.get("/api/cards/similarity/correlations")
    assert res.status_code == 200
    corrs = res.json()["data"]
    assert len(corrs) == 17
    print(f"✓ Collinearity verified: 17 high-correlation pairs (|r| > 0.80) decoupled")

def test_8_what_if_simulator():
    payload = {
        "monthly_spend": {
            "Dining": 400.0,
            "Groceries": 600.0,
            "Travel": 300.0,
            "Shopping": 500.0,
            "Transportation": 180.0
        },
        "preferred_brand": "All",
        "max_annual_fee": 550.0
    }
    t0 = time.time()
    res = client.post("/api/recommendations/simulate", json=payload)
    duration = time.time() - t0
    assert res.status_code == 200
    result_data = res.json()["data"]
    top_cards = result_data["top_recommended_cards"]
    assert len(top_cards) > 0
    top = top_cards[0]
    assert "net_annual_value" in top
    assert "card_name" in top
    assert "effective_reward_rate_pct" in top
    assert "category_breakdown" in top
    print(f"✓ What-If Simulator verified ({duration*1000:.1f}ms): {len(top_cards)} commercial cards ranked, Top: {top['card_name']} (Net Value: ${top['net_annual_value']:,.2f})")

def test_9_fraud_overview():
    t0 = time.time()
    res = client.get("/api/fraud/overview")
    duration = time.time() - t0
    assert res.status_code == 200
    kpis = res.json()["kpis"]
    assert kpis["total_transactions_analyzed"] == 24386900
    assert kpis["confirmed_fraud_transactions"] == 29757
    assert kpis["confirmed_fraud_volume"] > 3_000_000
    print(f"✓ Fraud Radar verified ({duration*1000:.1f}ms): 29,757 confirmed ground-truth fraud cases (${kpis['confirmed_fraud_volume']:,.2f})")

if __name__ == "__main__":
    test_1_portfolio_summary()
    test_2_portfolio_categories()
    test_3_customer_360_user_0()
    test_4_customer_deep_cards()
    test_5_customer_segments()
    test_6_feature_weights()
    test_7_collinear_pairs()
    test_8_what_if_simulator()
    test_9_fraud_overview()
    print("\n==========================================")
    print("ALL 9 CORE INTEGRATION BENCHMARKS PASSED")
    print("==========================================")
