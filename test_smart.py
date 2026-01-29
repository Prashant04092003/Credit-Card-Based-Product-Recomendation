from app.logic.smart_recommendations_data import get_smart_recommendations_data

data = get_smart_recommendations_data()

print("KPIs")
print(data["kpis"])

print("\nTop Recommended Cards")
print(data["charts"]["top_recommended_cards"])

print("\nRecommendations by Persona")
print(data["charts"]["recommendations_by_persona"])

print("\nCoverage Gaps")
print(data["charts"]["coverage_gaps"])