from app.logic.home_data import get_home_overview_data

data = get_home_overview_data()

print("KPIs")
print(data["kpis"])
print("\nPersona Distribution (top 5)")
print(data["charts"]["persona_distribution"][:5])
print("\nFraud Trend (first 5)")
print(data["charts"]["fraud_trend_monthly"][:5])