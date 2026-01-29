from app.logic.card_portfolio_data import get_card_portfolio_data

data = get_card_portfolio_data()

print("KPIs")
print(data["kpis"])

print("\nBrand Exposure")
print(data["charts"]["brand_exposure"])

print("\nCard Type Mix")
print(data["charts"]["card_type_mix"])

print("\nCredit Limit Distribution")
print(data["charts"]["credit_limit_distribution"])

print("\nCatalog Overview")
print(data["charts"]["catalog_overview"])