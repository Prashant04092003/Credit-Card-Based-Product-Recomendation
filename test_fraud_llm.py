from app.logic.fraud_data import get_fraud_intelligence_data
from app.llm.explainers import generate_fraud_explanations

fraud_data = get_fraud_intelligence_data()
explanations = generate_fraud_explanations(fraud_data)

for k, v in explanations.items():
    print(f"\n{k.upper()}")
    print(v)