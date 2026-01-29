# frontend/pages/_Cards.py

import streamlit as st
import pandas as pd
import plotly.express as px
from api_client import fetch_data

# =========================
# Page Header
# =========================
st.title("Cards Portfolio")
st.caption(
    "Overview of issued cards, product mix, brands, and credit capacity across the portfolio."
)

# =========================
# Fetch Cards API
# =========================
data = fetch_data("cards")
payload = data["data"]

kpis = payload["kpis"]
charts = payload["charts"]
explanations = data.get("explanations", {})

# =========================
# KPI ROW
# =========================
c1, c2, c3 = st.columns(3)

c1.metric("Total Cards Issued", f"{kpis['total_cards_issued']:,}")
c2.metric("Average Credit Limit", f"${kpis['avg_credit_limit']:,.0f}")
c3.metric("Unique Card Types", kpis["unique_card_types_held"])

st.divider()

# =========================
# Brand Exposure
# =========================
st.subheader("Brand Exposure")

brand_df = pd.DataFrame(charts["brand_exposure"])

fig = px.bar(
    brand_df,
    x="Card Brand",
    y="cards_issued",
    labels={
        "Card Brand": "Card Brand",
        "cards_issued": "Cards Issued"
    }
)

fig.update_layout(
    showlegend=False,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["brand_exposure"]["why_this_exists"])
    st.markdown(f"**What it captures:** {explanations['brand_exposure']['what_signal_it_captures']}")
    st.markdown(f"**What to do next:** {explanations['brand_exposure']['what_to_do_next']}")

st.divider()

# =========================
# Card Type Mix
# =========================
st.subheader("Card Type Mix")

type_df = pd.DataFrame(charts["card_type_mix"])

fig = px.pie(
    type_df,
    names="Card Type",
    values="cards_issued",
    hole=0.4
)

fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["card_type_mix"]["why_this_exists"])
    st.markdown(f"**What it captures:** {explanations['card_type_mix']['what_signal_it_captures']}")
    st.markdown(f"**What to do next:** {explanations['card_type_mix']['what_to_do_next']}")

st.divider()

# =========================
# Credit Limit Distribution
# =========================
st.subheader("Credit Limit Distribution")

limit_df = pd.DataFrame(charts["credit_limit_distribution"])

fig = px.bar(
    limit_df,
    x="limit_band",
    y="card_count",
    labels={
        "limit_band": "Credit Limit Band",
        "card_count": "Number of Cards"
    }
)

fig.update_layout(
    showlegend=False,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["credit_limit_distribution"]["why_this_exists"])
    st.markdown(f"**What it captures:** {explanations['credit_limit_distribution']['what_signal_it_captures']}")
    st.markdown(f"**What to do next:** {explanations['credit_limit_distribution']['what_to_do_next']}")

st.divider()

# =========================
# Product Catalog Coverage
# =========================
st.subheader("Product Catalog Coverage")

catalog_df = pd.DataFrame(charts["catalog_overview"])

fig = px.bar(
    catalog_df,
    x="card_tier",
    y="product_count",
    labels={
        "card_tier": "Product Tier",
        "product_count": "Number of Products"
    }
)

fig.update_layout(
    showlegend=False,
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
)

st.plotly_chart(fig, use_container_width=True)

with st.expander("How to read this"):
    st.markdown(explanations["catalog_overview"]["why_this_exists"])
    st.markdown(f"**What it captures:** {explanations['catalog_overview']['what_signal_it_captures']}")
    st.markdown(f"**What to do next:** {explanations['catalog_overview']['what_to_do_next']}")

st.divider()

# =========================
# Page Summary
# =========================
st.subheader("Summary")

st.info(explanations["page_summary"]["page_summary"])

from components.gemini_insight import render_gemini_insight

render_gemini_insight(
    title="Card Portfolio Health",
    context="""
Overview of card portfolio structure including brand exposure,
card type mix, credit limits, and product catalog coverage.
""",
    metrics={
        "total_cards_issued": kpis["total_cards_issued"],
        "avg_credit_limit": kpis["avg_credit_limit"],
        "top_brand": brand_df.sort_values(
            "cards_issued", ascending=False
        ).iloc[0]["Card Brand"],
        "dominant_card_type": type_df.sort_values(
            "cards_issued", ascending=False
        ).iloc[0]["Card Type"]
    }
)