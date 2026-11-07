from backend.database import db

class AnalyticsService:
    def __init__(self):
        self.db = db
        self._cache = {}

    def get_portfolio_kpis(self):
        if "portfolio_kpis" in self._cache:
            return self._cache["portfolio_kpis"]

        query = """
            SELECT 
                count(*) as total_transactions,
                round(sum(amount), 2) as total_spend_volume,
                round(avg(amount), 2) as avg_transaction_amount,
                sum(case when is_fraud = 1 then 1 else 0 end) as total_fraud_transactions,
                round(sum(case when is_fraud = 1 then amount else 0 end), 2) as total_fraud_volume,
                round(sum(case when is_fraud = 1 then 1.0 else 0.0 end) / count(*) * 100, 3) as fraud_rate_pct,
                count(distinct user) as total_customers,
                count(distinct merchant_name) as unique_merchants
            FROM transactions
        """
        row = self.db.get_cursor().execute(query).fetchone()
        
        result = {
            "total_transactions": int(row[0]),
            "total_spend_volume": float(row[1]),
            "avg_transaction_amount": float(row[2]),
            "total_fraud_transactions": int(row[3]),
            "total_fraud_volume": float(row[4]),
            "fraud_rate_pct": float(row[5]),
            "total_customers": int(row[6]),
            "unique_merchants": int(row[7]),
            "total_cards": len(self.db.cards_master),
            "commercial_cards_catalog": len(self.db.commercial_catalog)
        }
        self._cache["portfolio_kpis"] = result
        return result

    def get_category_distribution(self):
        if "category_dist" in self._cache:
            return self._cache["category_dist"]

        query = """
            SELECT 
                super_category,
                count(*) as tx_count,
                round(sum(amount), 2) as volume,
                round(sum(amount) / 1064098117.16 * 100, 2) as volume_pct,
                sum(case when is_fraud = 1 then 1 else 0 end) as fraud_count
            FROM transactions
            GROUP BY super_category
            ORDER BY volume DESC
        """
        rows = self.db.get_cursor().execute(query).fetchall()
        result = [
            {
                "category": r[0] if r[0] else "Other",
                "transaction_count": int(r[1]),
                "volume": float(r[2]),
                "volume_pct": float(r[3]),
                "fraud_count": int(r[4])
            }
            for r in rows
        ]
        self._cache["category_dist"] = result
        return result

    def get_network_brand_distribution(self):
        if "brand_dist" in self._cache:
            return self._cache["brand_dist"]

        query = """
            SELECT 
                card_brand,
                count(*) as tx_count,
                round(sum(amount), 2) as volume,
                count(distinct card_index) as card_count
            FROM transactions
            GROUP BY card_brand
            ORDER BY volume DESC
        """
        rows = self.db.get_cursor().execute(query).fetchall()
        result = [
            {
                "brand": r[0] if r[0] else "Unknown",
                "transaction_count": int(r[1]),
                "volume": float(r[2]),
                "card_count": int(r[3])
            }
            for r in rows
        ]
        self._cache["brand_dist"] = result
        return result

    def get_monthly_trend(self):
        if "monthly_trend" in self._cache:
            return self._cache["monthly_trend"]

        query = """
            SELECT 
                year, month,
                count(*) as tx_count,
                round(sum(amount), 2) as volume,
                sum(case when is_fraud = 1 then 1 else 0 end) as fraud_count
            FROM transactions
            GROUP BY year, month
            ORDER BY year, month
        """
        rows = self.db.get_cursor().execute(query).fetchall()
        result = [
            {
                "date": f"{r[0]}-{str(r[1]).zfill(2)}",
                "year": int(r[0]),
                "month": int(r[1]),
                "transaction_count": int(r[2]),
                "volume": float(r[3]),
                "fraud_count": int(r[4])
            }
            for r in rows
        ]
        self._cache["monthly_trend"] = result
        return result

    def get_persona_distribution(self):
        recos = self.db.recommendations
        persona_counts = (
            recos.groupby("persona")["user_id"]
            .nunique()
            .reset_index(name="customer_count")
            .sort_values("customer_count", ascending=False)
            .to_dict(orient="records")
        )
        return persona_counts

analytics_service = AnalyticsService()

