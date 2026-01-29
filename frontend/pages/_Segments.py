# frontend/pages/_Segmentation.py

import streamlit as st
import pandas as pd
import plotly.express as px
from api_client import fetch_data

# =========================
# Page Header
# =========================
st.title("Customer Segmentation")
st.caption(
    "Behavioral personas derived from spending patterns, credit usage, and volatility."
)

# =========================
# Fetch Segmentation API
# =========================
data = fetch_data("segments")
payload = data["data"]

kpis = payload["kpis"]
charts = payload["charts"]
explanations = data.get("explanations", {})

# =========================
# KPI ROW
# =========================
c1, c2, c3, c4 = st.columns(4)

c1.metric("Total Personas", kpis["total_personas"])
c2.metric("Largest Persona Share (%)", round(kpis["largest_persona_share_pct"], 2))
c3.metric("Avg Cards per User", round(kpis["avg_cards_per_user"], 2))
c4.metric("Avg Txns per User", int(kpis["avg_txn_per_user"]))

st.divider()

# =========================
# Persona Distribution
# =========================
st.subheader("Persona Distribution")

persona_df = pd.DataFrame(charts["persona_distribution"])

fig = px.bar(
    persona_df,
    x="persona",
    y="user_count",
    labels={
        "persona": "Persona",
        "user_count": "Number of Users"
    }
)

fig.update_layout(
    xaxis_tickangle=-30,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["persona_distribution"]["why_this_exists"])
    st.markdown(f"**What it captures:** {explanations['persona_distribution']['what_signal_it_captures']}")
    st.markdown(f"**What to do next:** {explanations['persona_distribution']['what_to_do_next']}")

st.divider()

# =========================
# Spend Intensity by Persona
# =========================
st.subheader("Spend Intensity by Persona")

spend_df = pd.DataFrame(charts["spend_intensity_by_persona"])

fig = px.bar(
    spend_df,
    x="persona",
    y="avg_total_spend",
    labels={
        "persona": "Persona",
        "avg_total_spend": "Average Total Spend"
    }
)

fig.update_layout(
    xaxis_tickangle=-30,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["spend_intensity_by_persona"]["why_this_exists"])
    st.markdown(f"**What it captures:** {explanations['spend_intensity_by_persona']['what_signal_it_captures']}")
    st.markdown(f"**What to do next:** {explanations['spend_intensity_by_persona']['what_to_do_next']}")

st.divider()

# =========================
# Spend Volatility by Persona
# =========================
st.subheader("Spend Volatility by Persona")

vol_df = pd.DataFrame(charts["spend_volatility_by_persona"])

fig = px.bar(
    vol_df,
    x="persona",
    y="avg_spend_volatility",
    labels={
        "persona": "Persona",
        "avg_spend_volatility": "Spend Volatility Index"
    }
)

fig.update_layout(
    xaxis_tickangle=-30,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["spend_volatility_by_persona"]["why_this_exists"])
    st.markdown(f"**What it captures:** {explanations['spend_volatility_by_persona']['what_signal_it_captures']}")
    st.markdown(f"**What to do next:** {explanations['spend_volatility_by_persona']['what_to_do_next']}")

st.divider()

# =========================
# Credit Capacity by Persona
# =========================
st.subheader("Credit Capacity by Persona")

credit_df = pd.DataFrame(charts["credit_capacity_by_persona"])

fig = px.scatter(
    credit_df,
    x="avg_credit_limit",
    y="avg_num_cards",
    size="avg_num_cards",
    color="persona",
    labels={
        "avg_credit_limit": "Average Credit Limit",
        "avg_num_cards": "Average Number of Cards",
    }
)

fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["credit_capacity_by_persona"]["why_this_exists"])
    st.markdown(f"**What it captures:** {explanations['credit_capacity_by_persona']['what_signal_it_captures']}")
    st.markdown(f"**What to do next:** {explanations['credit_capacity_by_persona']['what_to_do_next']}")

st.divider()

# =========================
# Page Summary
# =========================
st.subheader("Summary")

st.info(explanations["page_summary"]["page_summary"])

from components.gemini_insight import render_gemini_insight

render_gemini_insight(
    title="Customer Persona Insights",
    context="""
Customer personas derived from spending behavior,
volatility, and credit capacity.
""",
    metrics={
        "total_personas": kpis["total_personas"],
        "largest_persona_share_pct": kpis["largest_persona_share_pct"],
        "top_persona": persona_df.sort_values(
            "user_count", ascending=False
        ).iloc[0]["persona"],
        "most_volatile_persona": vol_df.sort_values(
            "avg_spend_volatility", ascending=False
        ).iloc[0]["persona"]
    }
)