# frontend/pages/1_Home.py

import streamlit as st
import pandas as pd
from api_client import fetch_data

# -------------------------
# Page Header
# -------------------------
st.title("Home / Overview")
st.caption(
    "Portfolio-level snapshot of customer scale, fraud exposure, and recommendation coverage."
)

data = fetch_data("home")

# -------------------------
# KPI ROW
# -------------------------
kpis = data["data"]["kpis"]

c1, c2, c3 = st.columns(3)
c1.metric("Total Users", kpis["total_users"])
c2.metric("Fraud Risk Index (%)", round(kpis["fraud_risk_index_pct"], 2))
c3.metric("Recommendation Coverage (%)", round(kpis["recommendation_coverage_pct"], 2))

st.divider()

# -------------------------
# Persona Distribution
# -------------------------
st.subheader("Customer Persona Distribution")

persona_df = pd.DataFrame(
    data["data"]["charts"]["persona_distribution"]
)

st.bar_chart(
    persona_df.set_index("persona")["user_count"]
)

with st.expander("How to read this chart"):
    expl = data["explanations"]["persona_distribution"]
    st.markdown(
        f"""
        **Why this exists**  
        {expl['why_this_exists']}

        **What signal it captures**  
        {expl['what_signal_it_captures']}

        **How to interpret it**  
        {expl['how_to_interpret']}

        **What you can do next**  
        {expl['what_to_do_next']}
        """
    )

st.divider()

# -------------------------
# Fraud Trend
# -------------------------
st.subheader("Fraud Risk Trend (Monthly)")

fraud_df = pd.DataFrame(
    data["data"]["charts"]["fraud_trend_monthly"]
)
fraud_df["year_month"] = pd.to_datetime(fraud_df["year_month"])

st.line_chart(
    fraud_df.set_index("year_month")["high_critical_pct"]
)

with st.expander("How to read this chart"):
    expl = data["explanations"]["fraud_risk_index"]
    st.markdown(
        f"""
        **Why this exists**  
        {expl['why_this_exists']}

        **What signal it captures**  
        {expl['what_signal_it_captures']}

        **How to interpret it**  
        {expl['how_to_interpret']}

        **What you can do next**  
        {expl['what_to_do_next']}
        """
    )

# -------------------------
# Page Summary
# -------------------------
st.divider()
st.subheader("Executive Summary")

st.success(
    data["explanations"]["page_summary"]["page_summary"]
)

from components.gemini_insight import render_gemini_insight

render_gemini_insight(
    title="Executive Portfolio Summary",
    context="""
Portfolio-level overview covering customer scale,
fraud exposure, and recommendation reach.
""",
    metrics={
        "total_users": int(kpis["total_users"]),
        "fraud_risk_index_pct": float(kpis["fraud_risk_index_pct"]),
        "recommendation_coverage_pct": float(kpis["recommendation_coverage_pct"]),
    }
)