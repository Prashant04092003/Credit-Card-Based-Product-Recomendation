from app.logic.fraud_data import get_fraud_intelligence_data

data = get_fraud_intelligence_data()

print("KPIs")
print(data["kpis"])

print("\nFraud Band Distribution")
print(data["charts"]["fraud_band_distribution"])

print("\nFraud Trend (first 5)")
print(data["charts"]["fraud_trend_monthly"][:5])

print("\nMerchant Behavior Risk")
print(data["charts"]["merchant_behavior_risk"])