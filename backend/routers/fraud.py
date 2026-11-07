from fastapi import APIRouter
from backend.database import db

router = APIRouter(prefix="/api/fraud", tags=["Fraud & Risk Radar"])

@router.get("/overview")
def get_fraud_overview():
    """
    Returns ground-truth fraud intelligence across all 24.38M transactions:
    - Confirmed fraud count and dollar volume
    - Fraud rate by super category
    - Dark web compromised card count
    - Transaction error velocity
    """
    con = db.get_cursor()

    # 1. Macro Fraud KPIs
    kpi_query = """
        SELECT 
            count(*) as total_txns,
            round(sum(amount), 2) as total_volume,
            sum(case when is_fraud = 1 then 1 else 0 end) as fraud_txns,
            round(sum(case when is_fraud = 1 then amount else 0 end), 2) as fraud_volume,
            round(sum(case when is_fraud = 1 then 1.0 else 0.0 end) / count(*) * 100, 3) as fraud_rate_pct,
            sum(case when errors is not null and errors != 'None' and errors != '' then 1 else 0 end) as error_txns
        FROM transactions
    """
    kpis = con.execute(kpi_query).fetchone()

    # 2. Fraud by Super Category
    by_category_query = """
        SELECT 
            super_category,
            count(*) as total_txns,
            sum(case when is_fraud = 1 then 1 else 0 end) as fraud_txns,
            round(sum(case when is_fraud = 1 then amount else 0 end), 2) as fraud_volume,
            round(sum(case when is_fraud = 1 then 1.0 else 0.0 end) / count(*) * 100, 3) as fraud_rate_pct
        FROM transactions
        GROUP BY super_category
        HAVING fraud_txns > 0
        ORDER BY fraud_volume DESC
    """
    by_category = [
        {
            "category": r[0] if r[0] else "Other",
            "total_transactions": int(r[1]),
            "fraud_transactions": int(r[2]),
            "fraud_volume": float(r[3]),
            "fraud_rate_pct": float(r[4])
        }
        for r in con.execute(by_category_query).fetchall()
    ]

    # 3. Dark Web Compromised Cards
    dark_web_count = con.execute("""
        SELECT count(*) FROM cards_master WHERE card_on_dark_web = true
    """).fetchone()[0]

    return {
        "status": "success",
        "kpis": {
            "total_transactions_analyzed": int(kpis[0]),
            "confirmed_fraud_transactions": int(kpis[2]),
            "confirmed_fraud_volume": float(kpis[3]),
            "overall_fraud_rate_pct": float(kpis[4]),
            "transaction_errors_count": int(kpis[5]),
            "dark_web_compromised_cards": int(dark_web_count)
        },
        "fraud_by_category": by_category
    }

@router.get("/timeline")
def get_fraud_timeline():
    """
    Returns the longitudinal monthly fraud incident frequency and volume trend.
    """
    con = db.get_cursor()
    query = """
        SELECT 
            year, month,
            count(*) as total_txns,
            sum(case when is_fraud = 1 then 1 else 0 end) as fraud_txns,
            round(sum(case when is_fraud = 1 then amount else 0 end), 2) as fraud_volume
        FROM transactions
        WHERE is_fraud = 1
        GROUP BY year, month
        ORDER BY year, month
    """
    rows = con.execute(query).fetchall()
    timeline = [
        {
            "date": f"{r[0]}-{str(r[1]).zfill(2)}",
            "year": int(r[0]),
            "month": int(r[1]),
            "total_transactions": int(r[2]),
            "fraud_transactions": int(r[3]),
            "fraud_volume": float(r[4])
        }
        for r in rows
    ]
    return {
        "status": "success",
        "total_months": len(timeline),
        "data": timeline
    }

