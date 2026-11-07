from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import (
    portfolio,
    customers,
    segments,
    card_similarity,
    recommendations,
    fraud,
    insights
)

app = FastAPI(
    title="Credit360 Intelligence Platform API",
    version="1.0.0",
    description="Enterprise Credit Card Analytics, Customer 360, Behavioral Recommendation, and Risk Intelligence Engine powered by DuckDB over 24.38M transactions."
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All Specialized Routers
app.include_router(portfolio.router)
app.include_router(customers.router)
app.include_router(segments.router)
app.include_router(card_similarity.router)
app.include_router(recommendations.router)
app.include_router(fraud.router)
app.include_router(insights.router)

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "message": "Credit360 Intelligence Platform API is active.",
        "documentation": "/docs",
        "total_transactions_indexed": 24386900,
        "total_customers_indexed": 2000,
        "total_cards_indexed": 6146
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

