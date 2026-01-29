# app/logic/customers_data.py

import pandas as pd
from data.loaders import load_users


def get_customers_data():
    """
    Computes all metrics required for the Customers (Demographics) dashboard.
    Purely descriptive — no personas, no fraud, no recommendations.
    """

    users_df = load_users()

    # -------------------------
    # Basic cleanup
    # -------------------------
    users_df["Yearly Income - Person"] = (
        users_df["Yearly Income - Person"]
        .replace("[\\$,]", "", regex=True)
        .astype(float)
    )

    users_df["Total Debt"] = (
        users_df["Total Debt"]
        .replace("[\\$,]", "", regex=True)
        .astype(float)
    )

    # -------------------------
    # KPIs
    # -------------------------
    total_customers = users_df.shape[0]
    avg_age = float(round(users_df["Current Age"].mean(), 1))
    avg_income = float(round(users_df["Yearly Income - Person"].mean(), 2))
    avg_cards = float(round(users_df["Num Credit Cards"].mean(), 2))

    # -------------------------
    # Chart 1: Age Bands
    # -------------------------
    users_df["age_band"] = pd.cut(
        users_df["Current Age"],
        bins=[18, 25, 35, 45, 55, 65, 100],
        labels=["18–25", "26–35", "36–45", "46–55", "56–65", "65+"]
    )

    age_distribution = (
        users_df
        .groupby("age_band")
        .size()
        .reset_index(name="customer_count")
        .to_dict(orient="records")
    )

    # -------------------------
    # Chart 2: Income Bands
    # -------------------------
    users_df["income_band"] = pd.cut(
        users_df["Yearly Income - Person"],
        bins=[0, 30000, 60000, 100000, 150000, 1e9],
        labels=["<30k", "30k–60k", "60k–100k", "100k–150k", "150k+"]
    )

    income_distribution = (
        users_df
        .groupby("income_band")
        .size()
        .reset_index(name="customer_count")
        .to_dict(orient="records")
    )

    # -------------------------
    # Chart 3: Geography (City)
    # -------------------------
    geography_city = (
        users_df
        .groupby(["State", "City"])
        .size()
        .reset_index(name="customer_count")
        .sort_values("customer_count", ascending=False)
        .to_dict(orient="records")
    )
        
    geography_state = (users_df.groupby("State", as_index=False).size().rename(columns={"size": "customer_count"}).to_dict(orient="records")
    )

      

    # -------------------------
    # Chart 4: Credit Posture
    # -------------------------
    users_df["debt_to_income"] = (
        users_df["Total Debt"] / users_df["Yearly Income - Person"]
    )

    credit_posture = (
        users_df
        .groupby(pd.cut(
            users_df["debt_to_income"],
            bins=[0, 0.25, 0.5, 0.75, 1, 10],
            labels=["<25%", "25–50%", "50–75%", "75–100%", "100%+"]
        ))
        .size()
        .reset_index(name="customer_count")
        .to_dict(orient="records")
    )

    # -------------------------
    # Chart 5: Card Ownership
    # -------------------------
    card_ownership = (
        users_df
        .groupby("Num Credit Cards")
        .size()
        .reset_index(name="customer_count")
        .to_dict(orient="records")
    )
    

    # -------------------------
    # Final Output
    # -------------------------
    return {
        "kpis": {
            "total_customers": int(total_customers),
            "avg_age": avg_age,
            "avg_income": avg_income,
            "avg_cards_per_customer": avg_cards
        },
        "charts": {
            "age_distribution": age_distribution,
            "income_distribution": income_distribution,
            "geography_city": geography_city,
            "geography_state": geography_state,
            "credit_posture": credit_posture,
            "card_ownership": card_ownership
        }
    }
def get_single_customer(user_id: int):
    users_df = load_users()

    users_df["Yearly Income - Person"] = (
        users_df["Yearly Income - Person"]
        .replace("[\\$,]", "", regex=True)
        .astype(float)
    )

    users_df["Total Debt"] = (
        users_df["Total Debt"]
        .replace("[\\$,]", "", regex=True)
        .astype(float)
    )

    if user_id < 0 or user_id >= len(users_df):
        return None

    row = users_df.iloc[user_id]

    dti = row["Total Debt"] / row["Yearly Income - Person"]

    return {
        "Person": row["Person"],
        "Current Age": int(row["Current Age"]),
        "City": row["City"],
        "State": row["State"],
        "Num Credit Cards": int(row["Num Credit Cards"]),
        "Yearly Income": float(row["Yearly Income - Person"]),
        "Total Debt": float(row["Total Debt"]),
        "FICO Score": int(row["FICO Score"]),
        "Debt-to-Income": round(dti, 2)
    }