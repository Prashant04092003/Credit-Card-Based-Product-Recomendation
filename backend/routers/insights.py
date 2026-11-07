from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.services.llm_service import llm_service
from backend.services.customer_360_service import customer_360_service
from backend.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/insights", tags=["AI Explainability & Gemini Insights"])

class CustomerInsightRequest(BaseModel):
    user_id: int

@router.post("/customer-360")
def generate_customer_insight(req: CustomerInsightRequest):
    """
    Generates two AI-powered narratives via Google Gemini 2.5 Flash:
    1. Banker Strategic Memo: Internal portfolio assessment, underwriting, and interchange lift.
    2. Customer Value Pitch: Plain-English value pitch explaining why Card #1 matches their everyday spend.
    """
    c360 = customer_360_service.get_customer_360(req.user_id)
    if not c360:
        raise HTTPException(status_code=404, detail=f"Customer ID {req.user_id} not found.")

    banker_memo = llm_service.generate_banker_insight(c360)
    customer_pitch = llm_service.generate_customer_pitch(c360)

    return {
        "status": "success",
        "user_id": req.user_id,
        "person": c360["demographics"]["person"],
        "data": {
            "banker_memo": banker_memo,
            "customer_pitch": customer_pitch
        }
    }

@router.post("/portfolio")
def generate_portfolio_insight():
    """
    Generates macro executive commentary on portfolio performance and fraud metrics.
    """
    kpis = analytics_service.get_portfolio_kpis()
    narrative = llm_service.generate_portfolio_insight(kpis)

    return {
        "status": "success",
        "data": {
            "portfolio_executive_memo": narrative
        }
    }

