from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Optional
from backend.database import db
from backend.services.simulator_service import simulator_service

router = APIRouter(prefix="/api/recommendations", tags=["Card Recommendations & Simulation"])

class SimulationRequest(BaseModel):
    monthly_spend: Dict[str, float] = Field(
        ...,
        example={
            "Dining": 400.0,
            "Groceries": 600.0,
            "Travel": 300.0,
            "Transportation": 150.0,
            "Shopping": 500.0,
            "Entertainment": 100.0,
            "Utilities": 200.0
        }
    )
    user_id: Optional[int] = None
    preferred_brand: str = "All"
    max_annual_fee: Optional[float] = None

@router.get("/overview")
def get_recommendations_overview():
    """
    Returns portfolio-wide recommendation analytics:
    - Total users with recommendations
    - Average recommendations per user
    - Top 10 recommended cards across all users
    - Recommendations by persona
    - Coverage gaps
    """
    con = db.get_cursor()
    
    # 1. KPIs
    users_with_reco = con.execute("SELECT count(distinct user_id) FROM recommendations").fetchone()[0]
    total_recos = con.execute("SELECT count(*) FROM recommendations").fetchone()[0]
    avg_reco_per_user = round(total_recos / users_with_reco, 2) if users_with_reco else 0.0

    # 2. Top Recommended Cards
    top_cards_query = """
        SELECT 
            card_id,
            card_name,
            brand,
            card_tier,
            round(avg(annual_fee), 2) as annual_fee,
            count(*) as recommendation_count
        FROM recommendations
        GROUP BY card_id, card_name, brand, card_tier
        ORDER BY recommendation_count DESC
        LIMIT 10
    """
    top_cards = [
        {
            "card_id": r[0],
            "card_name": r[1],
            "brand": r[2],
            "tier": r[3],
            "annual_fee": float(r[4]),
            "recommendation_count": int(r[5])
        }
        for r in con.execute(top_cards_query).fetchall()
    ]

    # 3. Recommendations by Persona
    by_persona_query = """
        SELECT 
            COALESCE(persona, 'Standard') as persona,
            count(*) as count
        FROM recommendations
        GROUP BY persona
        ORDER BY count DESC
    """
    by_persona = [
        {"persona": r[0], "count": int(r[1])}
        for r in con.execute(by_persona_query).fetchall()
    ]

    # 4. Coverage Gaps (Distribution of recommendation count per user)
    coverage_query = """
        WITH user_reco_counts AS (
            SELECT user_id, count(*) as reco_count
            FROM recommendations
            GROUP BY user_id
        )
        SELECT reco_count, count(*) as user_count
        FROM user_reco_counts
        GROUP BY reco_count
        ORDER BY reco_count ASC
    """
    coverage_gaps = [
        {"recommendation_count": int(r[0]), "user_count": int(r[1])}
        for r in con.execute(coverage_query).fetchall()
    ]

    return {
        "status": "success",
        "kpis": {
            "users_with_recommendations": int(users_with_reco),
            "total_recommendations": int(total_recos),
            "avg_recommendations_per_user": avg_reco_per_user,
            "coverage_rate_pct": round(users_with_reco / 2000 * 100, 1)
        },
        "top_recommended_cards": top_cards,
        "recommendations_by_persona": by_persona,
        "coverage_distribution": coverage_gaps
    }

@router.get("/user/{user_id}")
def get_user_recommendations(user_id: int):
    """
    Returns all ranked recommendations (Rank 1 to 10) for a specific user,
    with card details, annual fees, APR, min FICO, and reward multipliers.
    """
    con = db.get_cursor()
    query = f"""
        SELECT 
            r.rank,
            r.card_id,
            r.card_name,
            r.brand,
            r.card_tier,
            r.annual_fee,
            r.apr,
            round(r.final_score, 2) as final_score,
            r.cluster_id,
            r.persona,
            cm.min_fico,
            cm.max_fico,
            cm.reward_grocery,
            cm.reward_dining,
            cm.reward_fuel,
            cm.reward_travel,
            cm.reward_retail,
            cm.reward_digital
        FROM recommendations r
        LEFT JOIN card_master cm ON r.card_id = cm.card_id
        WHERE r.user_id = {user_id}
        ORDER BY r.rank ASC
    """
    rows = con.execute(query).fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail=f"No recommendations found for user {user_id}")

    results = []
    for r in rows:
        results.append({
            "rank": int(r[0]),
            "card_id": r[1],
            "card_name": r[2],
            "brand": r[3],
            "tier": r[4],
            "annual_fee": float(r[5]),
            "apr": float(r[6]),
            "final_score": float(r[7]),
            "cluster_id": int(r[8]),
            "persona": r[9],
            "min_fico": int(r[10]) if r[10] is not None else 650,
            "rewards": {
                "Groceries": float(r[12]) if r[12] is not None else 1.0,
                "Dining": float(r[13]) if r[13] is not None else 1.0,
                "Fuel": float(r[14]) if r[14] is not None else 1.0,
                "Travel": float(r[15]) if r[15] is not None else 1.0,
                "Retail": float(r[16]) if r[16] is not None else 1.0,
                "Digital": float(r[17]) if r[17] is not None else 1.0,
            }
        })

    return {
        "status": "success",
        "user_id": user_id,
        "recommendations_count": len(results),
        "data": results
    }

@router.post("/simulate")
def simulate_recommendations(req: SimulationRequest):
    """
    Interactive 'What-If' Simulation endpoint:
    Accepts customized monthly spend allocations across categories and recalculates
    projected net annual reward value against all 354 commercial cards in real-time.
    """
    simulation_result = simulator_service.simulate(
        monthly_spend=req.monthly_spend,
        user_id=req.user_id,
        preferred_brand=req.preferred_brand,
        max_annual_fee=req.max_annual_fee
    )
    return {
        "status": "success",
        "data": simulation_result
    }

