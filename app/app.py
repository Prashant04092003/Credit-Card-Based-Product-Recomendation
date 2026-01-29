# app/app.py
from dotenv import load_dotenv
load_dotenv()
from flask import Flask
from app.api.home import home_bp
from app.api.fraud import fraud_bp
from app.api.segments import segments_bp
from app.api.customers import customers_bp
from app.api.cards import cards_bp
from app.api.recommendation import recommendations_bp
from app.api.insights import insights_bp

def create_app():
    app = Flask(__name__)

    # Register blueprints
    app.register_blueprint(home_bp)
    app.register_blueprint(fraud_bp)
    app.register_blueprint(segments_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(cards_bp)
    app.register_blueprint(recommendations_bp)
    app.register_blueprint(insights_bp, url_prefix='/api')

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5050)  # ✅ THIS LINE IS THE FIX