from app.logic.segments_data import get_segments_personas_data
from app.llm.explainers import generate_segments_explanations

data = get_segments_personas_data()
explanations = generate_segments_explanations(data)

for k, v in explanations.items():
    print(f"\n{k.upper()}")
    print(v)