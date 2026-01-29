# frontend/pages/_Fraud.py

import streamlit as st
import pandas as pd
import plotly.express as px
from api_client import fetch_data

# -------------------------
# Page Header
# -------------------------
st.title("Fraud Intelligence")
st.caption(
    "Portfolio-level fraud risk signals, behavioral drivers, and temporal trends."
)

# Fetch data from API
data = fetch_data("fraud")

# -------------------------
# KPI ROW (CORRECT — matches API)
# -------------------------
kpis = data["data"]["kpis"]

c1, c2 = st.columns(2)
c1.metric(
    "Fraud Risk Index (%)",
    round(kpis["fraud_risk_index_pct"], 2)
)
c2.metric(
    "High + Critical Txn Share (%)",
    round(kpis["high_risk_txn_share_pct"], 2)
)

st.divider()

# -------------------------
# Fraud Trend (Line + Rolling Average)
# -------------------------
st.subheader("Fraud Risk Trend Over Time")

trend_df = pd.DataFrame(data["data"]["charts"]["fraud_trend_monthly"])
trend_df["year_month"] = pd.to_datetime(trend_df["year_month"])
trend_df = trend_df.sort_values("year_month")

trend_df["rolling_avg"] = (
    trend_df["high_critical_pct"]
    .rolling(window=3, min_periods=1)
    .mean()
)

fig = px.line(
    trend_df,
    x="year_month",
    y="high_critical_pct",
    markers=True,
    labels={
        "year_month": "Month",
        "high_critical_pct": "High + Critical Share (%)",
    },
)

fig.add_scatter(
    x=trend_df["year_month"],
    y=trend_df["rolling_avg"],
    mode="lines",
    line=dict(width=3),
    name="3-Month Rolling Avg",
)

fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    xaxis=dict(showgrid=False),
    yaxis=dict(showgrid=True),
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(
        """
        **Why this exists**  
        To track how fraud risk evolves over time.

        **What signal it captures**  
        The share of transactions classified as high or critical risk.

        **How to interpret it**  
        Short-term volatility is smoothed by the rolling average to reveal trend direction.

        **What you can do next**  
        Investigate sustained increases and align fraud controls proactively.
        """
    )

st.divider()

# -------------------------
# Fraud Risk Momentum
# -------------------------
st.subheader("Fraud Risk Momentum")

if len(trend_df) >= 4:
    recent_avg = trend_df["rolling_avg"].iloc[-1]
    prev_avg = trend_df["rolling_avg"].iloc[-4]
    delta = recent_avg - prev_avg

    if delta > 0.3:
        st.error(f" Risk Accelerating (+{delta:.2f}%)")
    elif delta < -0.3:
        st.success(f" Risk Stabilizing ({delta:.2f}%)")
    else:
        st.warning(f" Risk Stable ({delta:.2f}%)")
else:
    st.info("Not enough data to compute momentum.")

# -------------------------
# Fraud Band Distribution
# -------------------------
st.subheader("Fraud Band Distribution")

band_df = pd.DataFrame(data["data"]["charts"]["fraud_band_distribution"])

fig = px.bar(
    band_df,
    x="fraud_band",
    y="txn_count",
    color="fraud_band",
    color_discrete_map={
        "Low": "#38B2AC",
        "Medium": "#63B3ED",
        "High": "#F6AD55",
        "Critical": "#FC8181",
    },
)

fig.update_layout(
    showlegend=False,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    xaxis=dict(title="Fraud Band"),
    yaxis=dict(title="Transaction Count"),
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(
        """
        **Why this exists**  
        To understand how transaction volume is distributed across fraud severity levels.

        **What signal it captures**  
        Concentration of risk across fraud bands.

        **How to interpret it**  
        Larger volumes in High and Critical bands indicate elevated exposure.

        **What you can do next**  
        Focus mitigation where volume and severity intersect.
        """
    )

st.divider()

# -------------------------
# Risk Concentration Score
# -------------------------
st.subheader("Risk Concentration")

total_txns = band_df["txn_count"].sum()
high_critical_txns = band_df[
    band_df["fraud_band"].isin(["High", "Critical"])
]["txn_count"].sum()

concentration_pct = (high_critical_txns / total_txns) * 100

c1, c2 = st.columns(2)
c1.metric(
    "High + Critical Concentration (%)",
    round(concentration_pct, 2)
)

if concentration_pct > 60:
    c2.error(" Risk Highly Concentrated")
elif concentration_pct > 40:
    c2.warning(" Moderate Concentration")
else:
    c2.success(" Well Distributed Risk")

# -------------------------
# Merchant Behavioral Risk
# -------------------------
st.subheader("Merchant Behavioral Risk")

behavior_df = pd.DataFrame(
    data["data"]["charts"]["merchant_behavior_risk"]
)

fig = px.bar(
    behavior_df,
    x="signal",
    y="high_critical_pct",
    labels={
        "signal": "Behavioral Signal",
        "high_critical_pct": "High + Critical Share (%)",
    },
)

fig.update_layout(
    showlegend=False,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    yaxis=dict(showgrid=True),
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(
        """
        **Why this exists**  
        To isolate behavioral triggers associated with elevated fraud risk.

        **What signal it captures**  
        Risk concentration driven by merchant novelty.

        **How to interpret it**  
        New merchant categories show stronger risk association than new merchants alone.

        **What you can do next**  
        Strengthen monitoring around category novelty rather than blanket merchant blocking.
        """
    )

st.divider()

# -------------------------
# Page Summary
# -------------------------
st.subheader("Summary")

st.info(
    "Fraud risk remains broadly stable with periodic fluctuations. "
    "Behavioral novelty—especially new merchant categories—drives disproportionate risk, "
    "supporting targeted and context-aware fraud controls."
)

from components.gemini_insight import render_gemini_insight

render_gemini_insight(
    title="Fraud Risk Overview",
    context="""
Portfolio-level fraud monitoring including risk index,
temporal trends, behavioral drivers, and concentration.
""",
    metrics={
        "fraud_risk_index_pct": kpis["fraud_risk_index_pct"],
        "high_risk_txn_share_pct": kpis["high_risk_txn_share_pct"],
        "dominant_fraud_band": band_df.sort_values(
            "txn_count", ascending=False
        ).iloc[0]["fraud_band"],
        "top_behavioral_signal": behavior_df.sort_values(
            "high_critical_pct", ascending=False
        ).iloc[0]["signal"]
    }
)