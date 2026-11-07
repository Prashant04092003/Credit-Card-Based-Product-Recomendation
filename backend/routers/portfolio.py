from fastapi import APIRouter
from backend.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio Analytics"])

@router.get("/summary")
def get_portfolio_summary():
    """
    Returns macro portfolio metrics across all 24.38M transactions and 2,000 customers.
    """
    kpis = analytics_service.get_portfolio_kpis()
    categories = analytics_service.get_category_distribution()
    brands = analytics_service.get_network_brand_distribution()
    monthly = analytics_service.get_monthly_trend()
    personas = analytics_service.get_persona_distribution()

    return {
        "status": "success",
        "data": {
            "kpis": kpis,
            "category_distribution": categories,
            "brand_distribution": brands,
            "monthly_trend": monthly,
            "persona_distribution": personas
        }
    }

@router.get("/categories")
def get_categories():
    return {
        "status": "success",
        "data": analytics_service.get_category_distribution()
    }

@router.get("/personas")
def get_personas():
    return {
        "status": "success",
        "data": analytics_service.get_persona_distribution()
    }

