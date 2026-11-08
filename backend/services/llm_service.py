import os
import google.generativeai as genai
from typing import Dict, Any
from backend.config import GEMINI_API_KEY, GEMINI_MODEL

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Warning: Could not configure Gemini API: {e}")

class LLMService:
    def __init__(self):
        self.model_name = GEMINI_MODEL
        self.enabled = bool(GEMINI_API_KEY)

    def _call_gemini(self, prompt: str) -> str:
        if not self.enabled:
            return "Gemini API key not configured in .env. Showing algorithmic metrics."
        try:
            model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"AI insight generation unavailable: {str(e)}"

    def generate_banker_insight(self, c360: Dict[str, Any]) -> str:
        d = c360.get("demographics", {})
        s = c360.get("spending_overview", {})
        r = c360.get("risk_profile", {})
        p = c360.get("persona", {})
        recos = c360.get("top_recommendations", [])
        top_card = recos[0] if recos else {}

        top_cats = s.get("category_distribution", [])[:3]
        top_cats_str = ", ".join([f"{c['category']} ({c['share_pct']}%)" for c in top_cats])

        prompt = f"""
You are a Principal Credit Risk & Portfolio Officer at a premier retail bank.
Write an executive decision memo for the following customer:

CUSTOMER PROFILE:
- Customer: {d.get('person')} (User ID: {d.get('user_id')}, Age: {d.get('age')}, City: {d.get('city')}, {d.get('state')})
- Financials: Income ${d.get('yearly_income'):,.2f} | FICO: {d.get('fico_score')} ({d.get('fico_band')}) | DTI: {d.get('debt_income_ratio')}
- Total Lifetime Spend: ${s.get('total_spend'):,.2f} across {s.get('total_transactions'):,} transactions
- Mean Ticket: ${s.get('avg_ticket'):.2f}
- Top Spend Categories: {top_cats_str}
- Assigned Persona: {p.get('persona_name')}
- Risk Assessment: Risk Band = {r.get('risk_band')} | Confirmed Fraud Swipes = {r.get('confirmed_fraud_transactions')} | Error Count = {r.get('transaction_errors_count')}
- Primary Recommendation: {top_card.get('card_name')} ({top_card.get('card_tier')}, Annual Fee: ${top_card.get('annual_fee')}, Net Annual Value: ${top_card.get('net_annual_value')})

Please provide:
1. Executive Rationale (Why this customer is primed for this card upgrade/cross-sell)
2. Commercial Upside (Interchange & portfolio lifetime value lift)
3. Risk & Underwriting Directive (FICO buffer, dark web/fraud flags, authorization limits)

Keep it crisp, professional, bulleted, and under 180 words.
"""
        return self._call_gemini(prompt)

    def generate_customer_pitch(self, c360: Dict[str, Any]) -> str:
        d = c360.get("demographics", {})
        s = c360.get("spending_overview", {})
        recos = c360.get("top_recommendations", [])
        top_card = recos[0] if recos else {}

        top_cats = s.get("category_distribution", [])[:2]
        top_cats_str = " and ".join([f"{c['category']}" for c in top_cats])

        prompt = f"""
You are a friendly personal financial advisor. Write a compelling, 3-sentence personalized recommendation pitch to the customer:
- Customer Name: {d.get('person')}
- Top Spending Habits: Concentrated in {top_cats_str}
- Recommended Card: {top_card.get('card_name')}
- Projected Net Annual Rewards: ${top_card.get('net_annual_value'):,.2f} per year

Explain clearly how this card rewards their specific everyday shopping habits compared to standard cards.
"""
        return self._call_gemini(prompt)

    def generate_portfolio_insight(self, kpi_data: Dict[str, Any]) -> str:
        prompt = f"""
You are a Chief Credit Officer. Review the bank's macro credit card portfolio metrics:
- Total Managed Transactions: {kpi_data.get('total_transactions'):,}
- Total Spend Volume: ${kpi_data.get('total_spend_volume'):,.2f}
- Active Customers: {kpi_data.get('total_customers'):,}
- Total Active Cards: {kpi_data.get('total_cards'):,}
- Confirmed Fraud Volume: ${kpi_data.get('total_fraud_volume'):,.2f} ({kpi_data.get('total_fraud_transactions'):,} incidents, {kpi_data.get('fraud_rate_pct')}%)

Provide an executive summary:
1. Portfolio Health & Velocity
2. Fraud & Interchange Exposure
3. Strategic Growth Action

Under 150 words.
"""
        return self._call_gemini(prompt)

llm_service = LLMService()

