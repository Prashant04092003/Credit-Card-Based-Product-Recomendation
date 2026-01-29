from app.logic.customers_data import get_customers_data

data = get_customers_data()

print("KPIs")
print(data["kpis"])

print("\nAge Distribution")
print(data["charts"]["age_distribution"])

print("\nIncome Distribution")
print(data["charts"]["income_distribution"])

print("\nTop Cities")
print(data["charts"]["geography_city"][:5])

print("\nCredit Posture")
print(data["charts"]["credit_posture"])

print("\nCard Ownership")
print(data["charts"]["card_ownership"])