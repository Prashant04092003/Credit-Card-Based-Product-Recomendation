import streamlit as st
import requests

API_URL = "http://127.0.0.1:5050/api/insights/"

def render_gemini_insight(title: str, context: str, metrics: dict):
    st.markdown("---")
    st.subheader(f" AI Insight: {title}")

    if st.button(
        "Generate Insight",
        key=f"gemini_{title.replace(' ', '_')}"
    ):
        with st.spinner("Analyzing..."):
            res = requests.post(
                API_URL,
                json={
                    "context": context,
                    "metrics": metrics
                }
            )

        if res.status_code == 200:
            st.markdown(res.json()["insight"])
        else:
            st.error("Gemini insight generation failed")