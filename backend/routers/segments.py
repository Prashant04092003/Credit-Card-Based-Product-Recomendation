from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from backend.database import db

router = APIRouter(prefix="/api/segments", tags=["Customer Segmentation & Personas"])

@router.get("/")
def get_all_segments():
    """
    Returns a comprehensive macro overview of all 6 customer personas/clusters,
    including customer count, total spend volume, average transaction size,
    average FICO score, and key category spending traits.
    """
    con = db.get_cursor()
    query = """
        SELECT 
            s.cluster as cluster_id,
            COALESCE(s.persona_name, 'Cohort ' || s.cluster) as persona_name,
            count(distinct s.User) as customer_count,
            round(sum(s.total_spend), 2) as total_spend_volume,
            round(avg(s.avg_txn_amount), 2) as avg_transaction_size,
            round(avg(u.fico_score), 1) as avg_fico_score,
            round(avg(u.yearly_income__person), 2) as avg_yearly_income,
            round(avg(s.category_entropy), 3) as avg_category_entropy,
            round(avg(s.spend_cv), 3) as avg_spend_volatility,
            round(avg(s.pct_high) * 100, 2) as avg_high_risk_pct,
            round(avg(s.pct_critical) * 100, 2) as avg_critical_risk_pct,
            round(avg(s.share_Groceries) * 100, 2) as avg_grocery_share_pct,
            round(avg(s.share_Retail_Apparel) * 100, 2) as avg_retail_share_pct,
            round(avg(s.share_Dining_Food) * 100, 2) as avg_dining_share_pct,
            round(avg(s.share_Travel_Lodging) * 100, 2) as avg_travel_share_pct,
            round(avg(s.share_Transport_Fuel) * 100, 2) as avg_fuel_share_pct
        FROM segmentation s
        LEFT JOIN users_master u ON s.User = u.user_id
        GROUP BY s.cluster, s.persona_name
        ORDER BY s.cluster ASC
    """
    rows = con.execute(query).fetchall()
    
    segments = []
    total_customers = sum(r[2] for r in rows) or 1
    for r in rows:
        segments.append({
            "cluster_id": int(r[0]),
            "persona_name": r[1],
            "customer_count": int(r[2]),
            "population_share_pct": round(int(r[2]) / total_customers * 100, 2),
            "total_spend_volume": float(r[3]),
            "avg_transaction_size": float(r[4]),
            "avg_fico_score": float(r[5]),
            "avg_yearly_income": float(r[6]),
            "avg_category_entropy": float(r[7]),
            "avg_spend_volatility": float(r[8]),
            "risk_profile": {
                "avg_high_risk_pct": float(r[9]),
                "avg_critical_risk_pct": float(r[10])
            },
            "top_category_weights": {
                "Retail & Apparel": float(r[12]),
                "Groceries": float(r[11]),
                "Dining": float(r[13]),
                "Travel": float(r[14]),
                "Fuel": float(r[15])
            }
        })
        
    return {
        "status": "success",
        "total_segments": len(segments),
        "data": segments
    }

@router.get("/{cluster_id}")
def get_segment_detail(cluster_id: int):
    """
    Returns deep behavioral traits, category distributions, and top recommended cards
    specifically tailored for a single persona / cluster.
    """
    con = db.get_cursor()
    
    # 1. Fetch Cluster Aggregate
    summary = con.execute(f"""
        SELECT 
            s.cluster as cluster_id,
            COALESCE(s.persona_name, 'Cohort ' || s.cluster) as persona_name,
            count(distinct s.User) as customer_count,
            round(sum(s.total_spend), 2) as total_spend_volume,
            round(avg(s.avg_txn_amount), 2) as avg_ticket,
            round(avg(u.fico_score), 1) as avg_fico,
            round(avg(u.yearly_income__person), 2) as avg_income,
            round(avg(s.share_Groceries) * 100, 2) as grocery_pct,
            round(avg(s.share_Retail_Apparel) * 100, 2) as retail_pct,
            round(avg(s.share_Dining_Food) * 100, 2) as dining_pct,
            round(avg(s.share_Travel_Lodging) * 100, 2) as travel_pct,
            round(avg(s.share_Transport_Fuel) * 100, 2) as transport_pct,
            round(avg(s.share_Healthcare_Wellness) * 100, 2) as healthcare_pct,
            round(avg(s.share_Utilities_Bills) * 100, 2) as utilities_pct,
            round(avg(s.share_Digital_Subscriptions) * 100, 2) as digital_pct,
            round(avg(s.share_Entertainment_Leisure) * 100, 2) as entertainment_pct
        FROM segmentation s
        LEFT JOIN users_master u ON s.User = u.user_id
        WHERE s.cluster = {cluster_id}
        GROUP BY s.cluster, s.persona_name
    """).fetchone()

    if not summary:
        raise HTTPException(status_code=404, detail=f"Segment Cluster {cluster_id} not found.")

    # 2. Top Recommended Cards for users in this cluster
    top_cards_query = f"""
        SELECT 
            r.card_name,
            r.brand,
            r.card_tier,
            round(avg(r.annual_fee), 2) as annual_fee,
            count(*) as recommendation_frequency
        FROM recommendations r
        JOIN segmentation s ON r.user_id = s.User
        WHERE s.cluster = {cluster_id}
        GROUP BY r.card_name, r.brand, r.card_tier
        ORDER BY recommendation_frequency DESC
        LIMIT 5
    """
    top_cards = [
        {
            "card_name": r[0],
            "brand": r[1],
            "tier": r[2],
            "annual_fee": float(r[3]),
            "recommendation_count": int(r[4])
        }
        for r in con.execute(top_cards_query).fetchall()
    ]

    return {
        "status": "success",
        "cluster_id": cluster_id,
        "persona_name": summary[1],
        "customer_count": int(summary[2]),
        "total_spend_volume": float(summary[3]),
        "avg_ticket": float(summary[4]),
        "avg_fico": float(summary[5]),
        "avg_income": float(summary[6]),
        "category_spend_distribution": [
            {"category": "Retail & Apparel", "share_pct": float(summary[8])},
            {"category": "Groceries", "share_pct": float(summary[7])},
            {"category": "Transportation & Fuel", "share_pct": float(summary[11])},
            {"category": "Healthcare", "share_pct": float(summary[12])},
            {"category": "Dining & Food", "share_pct": float(summary[9])},
            {"category": "Utilities & Bills", "share_pct": float(summary[13])},
            {"category": "Digital Subscriptions", "share_pct": float(summary[14])},
            {"category": "Travel & Lodging", "share_pct": float(summary[10])},
            {"category": "Entertainment & Leisure", "share_pct": float(summary[15])}
        ],
        "top_recommended_cards_for_segment": top_cards
    }

@router.get("/{cluster_id}/customers")
def get_customers_in_segment(
    cluster_id: int,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """
    Returns a list of all customers belonging to this specific cluster/persona,
    with search and pagination support.
    """
    con = db.get_cursor()
    offset = (page - 1) * limit
    
    where_clause = f"s.cluster = {cluster_id}"
    if search is not None and isinstance(search, str) and search.strip():
        q = search.strip().replace("'", "''")
        if q.isdigit():
            where_clause += f" AND (u.user_id = {int(q)})"
        else:
            where_clause += f" AND (lower(u.person) LIKE '%{q.lower()}%' OR lower(u.city) LIKE '%{q.lower()}%' OR lower(u.state) LIKE '%{q.lower()}%')"
    
    total = con.execute(f"""
        SELECT count(*) 
        FROM segmentation s
        JOIN users_master u ON s.User = u.user_id
        WHERE {where_clause}
    """).fetchone()[0]
    
    query = f"""
        SELECT 
            u.user_id,
            u.person,
            u.current_age,
            u.city,
            u.state,
            u.yearly_income__person,
            u.fico_score,
            s.total_spend,
            s.txn_count,
            s.avg_txn_amount
        FROM segmentation s
        JOIN users_master u ON s.User = u.user_id
        WHERE {where_clause}
        ORDER BY s.total_spend DESC
        LIMIT {limit} OFFSET {offset}
    """
    rows = con.execute(query).fetchall()
    
    customers = [
        {
            "user_id": int(r[0]),
            "person": r[1],
            "age": int(r[2]),
            "city": r[3],
            "state": r[4],
            "yearly_income": float(r[5]),
            "fico_score": int(r[6]),
            "total_spend": float(r[7]),
            "transaction_count": int(r[8]),
            "avg_ticket": float(r[9])
        }
        for r in rows
    ]

    return {
        "status": "success",
        "cluster_id": cluster_id,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_records": total,
            "total_pages": (total + limit - 1) // limit if limit > 0 else 1
        },
        "data": customers
    }
