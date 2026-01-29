from app.logic.segments_data import get_segments_personas_data

data = get_segments_personas_data()

print("KPIs")
print(data["kpis"])

print("\nPersona Distribution")
print(data["charts"]["persona_distribution"])

print("\nSpend Intensity")
print(data["charts"]["spend_intensity_by_persona"])

print("\nSpend Volatility")
print(data["charts"]["spend_volatility_by_persona"])

print("\nCredit Capacity")
print(data["charts"]["credit_capacity_by_persona"])