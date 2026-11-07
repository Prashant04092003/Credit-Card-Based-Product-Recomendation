import pandas as pd
from typing import Dict, Optional, Any
from backend.database import db

class SimulatorService:
    def __init__(self):
        self.db = db

    def simulate(
        self,
        monthly_spend: Dict[str, float],
        user_id: Optional[int] = None,
        preferred_brand: str = "All",
        max_annual_fee: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Dynamically calculates projected annual reward value and net savings across
        the 354 commercial credit cards catalog based on custom spend allocations.
        """
        cards_df = self.db.commercial_catalog.copy()

        # Filter by annual fee if specified
        if max_annual_fee is not None:
            cards_df = cards_df[cards_df["annual_fee"] <= max_annual_fee]

        # Filter by preferred brand if specified
        if preferred_brand and preferred_brand.lower() != "all":
            cards_df = cards_df[
                cards_df["card_brand"].str.lower() == preferred_brand.lower()
            ]

        # Calculate annual spend per category
        annual_spend = {
            cat: float(amt) * 12.0
            for cat, amt in monthly_spend.items()
            if float(amt) > 0
        }
        total_annual_spend = sum(annual_spend.values())

        if total_annual_spend == 0:
            total_annual_spend = 1.0  # prevent division by zero

        results = []
        for _, card in cards_df.iterrows():
            gross_rewards = 0.0
            category_breakdown = {}
            base_rate = float(card.get("base_rate", 1.0) or 1.0)

            for cat, ann_amt in annual_spend.items():
                # Match against commercial category multiplier
                mult = float(card.get(cat, base_rate) or base_rate)
                mult = max(mult, base_rate, 1.0)
                reward_val = ann_amt * (mult * 0.01)
                gross_rewards += reward_val
                category_breakdown[cat] = {
                    "monthly_spend": monthly_spend[cat],
                    "annual_spend": ann_amt,
                    "multiplier": mult,
                    "annual_rewards_earned": round(reward_val, 2)
                }

            annual_fee = float(card.get("annual_fee", 0.0) or 0.0)
            signup_bonus_amortized = float(card.get("signup_bonus_value", 0.0) or 0.0) * 0.5  # amortized over 2 yrs
            net_annual_value = round(gross_rewards + signup_bonus_amortized - annual_fee, 2)
            effective_reward_rate = round((gross_rewards / total_annual_spend) * 100, 2)

            results.append({
                "card_id": int(card["card_id"]),
                "card_name": card.get("card_name", "Card"),
                "issuer_name": card.get("issuer_name", "Issuer"),
                "card_brand": card.get("card_brand", "Unknown"),
                "product_type": card.get("product_type", "personal"),
                "reward_currency": card.get("reward_currency", "points"),
                "annual_fee": annual_fee,
                "gross_annual_rewards": round(gross_rewards, 2),
                "signup_bonus_value": float(card.get("signup_bonus_value", 0.0) or 0.0),
                "net_annual_value": net_annual_value,
                "effective_reward_rate_pct": effective_reward_rate,
                "category_breakdown": category_breakdown
            })

        # Sort descending by net annual value
        results.sort(key=lambda x: x["net_annual_value"], reverse=True)
        top_cards = results[:5]

        # Add ranking index
        for idx, c in enumerate(top_cards, start=1):
            c["rank"] = idx

        return {
            "simulation_inputs": {
                "monthly_spend": monthly_spend,
                "total_monthly_spend": sum(monthly_spend.values()),
                "total_annual_spend": total_annual_spend,
                "preferred_brand": preferred_brand,
                "max_annual_fee": max_annual_fee
            },
            "top_recommended_cards": top_cards
        }

simulator_service = SimulatorService()

