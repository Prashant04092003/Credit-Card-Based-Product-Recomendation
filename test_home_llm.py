from app.logic.home_data import get_home_overview_data
from app.llm.explainers import generate_home_explanations

home_data = get_home_overview_data()
explanations = generate_home_explanations(home_data)

print("Visual Explanations:")
for k, v in explanations.items():
    print(f"\n{k.upper()}")
    print(v)