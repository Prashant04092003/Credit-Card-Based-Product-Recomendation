import streamlit as st

st.set_page_config(
    page_title="Credit Card Intelligence Dashboard",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("Credit Card Intelligence Dashboard")

st.markdown(
    """
    This dashboard provides a unified view of:
    - Customer demographics
    - Fraud intelligence
    - Behavioral segments
    - Card portfolio exposure
    - Smart credit card recommendations
    """
)

st.info("Use the sidebar to navigate once pages are added.")