# frontend/pages/_Recommendations.py

import streamlit as st
import pandas as pd
import plotly.express as px
from api_client import fetch_data

# =========================
# Page Header
# =========================
st.title("Card Recommendations")
st.caption(
    "Portfolio-level view of personalized card recommendations, coverage gaps, and product alignment."
)

# =========================
# Fetch Recommendations API
# =========================
data = fetch_data("recommendations")
payload = data["data"]

kpis = payload["kpis"]
charts = payload["charts"]
explanations = data.get("explanations", {})

# =========================
# KPI ROW
# =========================
c1, c2 = st.columns(2)

c1.metric(
    "Users with Recommendations",
    f"{kpis['users_with_recommendations']:,}"
)

c2.metric(
    "Avg Recommendations per User",
    round(kpis["avg_recommendations_per_user"], 2)
)

st.divider()

# =========================
# Recommendations by Persona
# =========================
st.subheader("Recommendations by Persona")

persona_df = pd.DataFrame(charts["recommendations_by_persona"])

fig = px.bar(
    persona_df,
    x="persona",
    y="recommendation_count",
    labels={
        "persona": "Persona",
        "recommendation_count": "Number of Recommendations"
    }
)

fig.update_layout(
    xaxis_tickangle=-30,
    showlegend=False,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["recommendations_by_persona"]["why_this_exists"])
    st.markdown(
        f"**What it captures:** {explanations['recommendations_by_persona']['what_signal_it_captures']}"
    )
    st.markdown(
        f"**What to do next:** {explanations['recommendations_by_persona']['what_to_do_next']}"
    )

st.divider()

# =========================
# Top Recommended Cards
# =========================
st.subheader("Top Recommended Cards")

cards_df = pd.DataFrame(charts["top_recommended_cards"])

fig = px.bar(
    cards_df,
    x="card_name",
    y="recommendation_count",
    labels={
        "card_name": "Card Product",
        "recommendation_count": "Times Recommended"
    }
)

fig.update_layout(
    xaxis_tickangle=-30,
    showlegend=False,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["top_recommended_cards"]["why_this_exists"])
    st.markdown(
        f"**What it captures:** {explanations['top_recommended_cards']['what_signal_it_captures']}"
    )
    st.markdown(
        f"**What to do next:** {explanations['top_recommended_cards']['what_to_do_next']}"
    )

st.divider()

# =========================
# Recommendation Coverage Gaps
# =========================
st.subheader("Recommendation Coverage Gaps")

gap_df = pd.DataFrame(charts["coverage_gaps"])

fig = px.bar(
    gap_df,
    x="recommendation_count",
    y="count",
    labels={
        "recommendation_count": "Number of Recommendations Received",
        "count": "Number of Users"
    }
)

fig.update_layout(
    showlegend=False,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["coverage_gaps"]["why_this_exists"])
    st.markdown(
        f"**What it captures:** {explanations['coverage_gaps']['what_signal_it_captures']}"
    )
    st.markdown(
        f"**What to do next:** {explanations['coverage_gaps']['what_to_do_next']}"
    )

st.divider()

# =========================
# Page Summary
# =========================
st.subheader("Summary")

st.info(explanations["page_summary"]["page_summary"])

from components.gemini_insight import render_gemini_insight

render_gemini_insight(
    title="Recommendation Effectiveness",
    context="""
Evaluation of personalized card recommendations,
persona alignment, and coverage gaps.
""",
    metrics={
        "users_with_recommendations": kpis["users_with_recommendations"],
        "avg_recommendations_per_user": kpis["avg_recommendations_per_user"],
        "top_persona": persona_df.sort_values(
            "recommendation_count", ascending=False
        ).iloc[0]["persona"],
        "top_recommended_card": cards_df.sort_values(
            "recommendation_count", ascending=False
        ).iloc[0]["card_name"]
    }
)