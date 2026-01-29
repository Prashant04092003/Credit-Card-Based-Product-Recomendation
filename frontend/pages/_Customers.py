# frontend/pages/_Customers.py

import streamlit as st
import pandas as pd
import plotly.express as px
from api_client import fetch_data
from components.gemini_insight import render_gemini_insight

# -------------------------
# Page Header
# -------------------------
st.title("Customers")
st.caption(
    "Demographic, geographic, and credit capacity overview of the customer base."
)

data = fetch_data("customers")

# -------------------------
# KPI ROW
# -------------------------
kpis = data["data"]["kpis"]

c1, c2, c3, c4 = st.columns(4)
c1.metric("Total Customers", kpis["total_customers"])
c2.metric("Average Age", round(kpis["avg_age"], 1))
c3.metric("Average Income", f"${int(kpis['avg_income']):,}")
c4.metric("Avg Cards / Customer", round(kpis["avg_cards_per_customer"], 2))

st.divider()

# -------------------------
# Age Distribution
# -------------------------
st.subheader("Age Distribution")

age_df = pd.DataFrame(data["data"]["charts"]["age_distribution"])
st.bar_chart(age_df.set_index("age_band")["customer_count"])

st.divider()

# -------------------------
# Income Distribution
# -------------------------
st.subheader("Income Distribution")

income_df = pd.DataFrame(data["data"]["charts"]["income_distribution"])
st.bar_chart(income_df.set_index("income_band")["customer_count"])

st.divider()

# -------------------------
# Geographic Distribution (Dark Map + Dots)
# -------------------------
st.subheader("Geographic Distribution")

state_df = pd.DataFrame(data["data"]["charts"]["geography_state"])

fig = px.choropleth(
    state_df,
    locations="State",
    locationmode="USA-states",
    color="customer_count",
    scope="usa",
    color_continuous_scale=["#0b2e2e", "#145f5f", "#1f8a8a", "#4fd1c5"],
    labels={"customer_count": "Customers"},
)

# Fake dots for texture
dot_df = state_df.loc[
    state_df.index.repeat(
        (state_df["customer_count"] / state_df["customer_count"].max() * 12)
        .astype(int) + 1
    )
]

state_centroids = {
    "CA": (36.77, -119.41),
    "TX": (31.97, -99.90),
    "NY": (43.30, -74.21),
    "FL": (27.66, -81.51),
    "IL": (40.63, -89.39),
}

dot_df["lat"] = dot_df["State"].map(lambda x: state_centroids.get(x, (37, -95))[0])
dot_df["lon"] = dot_df["State"].map(lambda x: state_centroids.get(x, (37, -95))[1])

fig.add_scattergeo(
    lat=dot_df["lat"],
    lon=dot_df["lon"],
    mode="markers",
    marker=dict(size=5, color="#9AE6E6", opacity=0.45),
    hoverinfo="skip",
)

fig.update_layout(
    geo=dict(bgcolor="rgba(0,0,0,0)"),
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    margin=dict(l=0, r=0, t=0, b=0),
)

st.plotly_chart(fig, use_container_width=True)

st.divider()

# -------------------------
# Credit Posture
# -------------------------
st.subheader("Credit Posture (Debt-to-Income)")

credit_df = pd.DataFrame(data["data"]["charts"]["credit_posture"])
st.bar_chart(credit_df.set_index("debt_to_income")["customer_count"])

st.divider()

# -------------------------
# Card Ownership Depth
# -------------------------
st.subheader("Card Ownership Depth")

cards_df = pd.DataFrame(data["data"]["charts"]["card_ownership"])
st.bar_chart(cards_df.set_index("Num Credit Cards")["customer_count"])

st.divider()

# -------------------------
# Individual Customer Drill-Down (✅ FIXED)
# -------------------------
st.subheader("Individual Customer Context")

with st.expander("View individual customer"):
    user_id = st.number_input(
        "Customer ID",
        min_value=0,
        step=1,
        help="Select a customer ID to view contextual information",
    )

    if st.button("Load Customer"):
        customer = fetch_data(f"customers/{int(user_id)}")["data"]

        st.markdown("### Customer Snapshot")

        c1, c2, c3 = st.columns(3)
        c1.metric("Age", customer["Current Age"])
        c2.metric("Yearly Income", f"${int(customer['Yearly Income']):,}")
        c3.metric("Location", f"{customer['City']}, {customer['State']}")

        c4, c5, c6 = st.columns(3)
        c4.metric("Cards Held", customer["Num Credit Cards"])
        c5.metric("Total Debt", f"${int(customer['Total Debt']):,}")
        c6.metric("Debt-to-Income", customer["Debt-to-Income"])

        st.metric("FICO Score", customer["FICO Score"])

        st.info(
            "This view shows raw customer attributes only. "
            "Behavioral, fraud, and recommendation insights are shown on other pages."
        )
        
        render_gemini_insight(
            title="Customer Financial Snapshot",
            context="""
Individual customer credit profile including age, income,
card holdings, debt burden, and creditworthiness.
""",
            metrics={
                "age": int(customer["Current Age"]),
                "yearly_income": int(customer["Yearly Income"]),
                "num_cards": int(customer["Num Credit Cards"]),
                "total_debt": int(customer["Total Debt"]),
                "debt_to_income": float(customer["Debt-to-Income"]),
                "fico_score": int(customer["FICO Score"]),
                "location": f"{customer['City']}, {customer['State']}",
            }
        )