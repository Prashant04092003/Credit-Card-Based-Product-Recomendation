import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"

# Core Data Files
PARQUET_FILE = DATA_DIR / "master_transactions.parquet"
USERS_MASTER_FILE = DATA_DIR / "users_master.csv"
CARDS_MASTER_FILE = DATA_DIR / "cards_master.csv"
CARDS_RAW_FILE = DATA_DIR / "cards.csv"
SEGMENTATION_FILE = DATA_DIR / "segmentation.csv"
CARD_SCORECARD_FILE = DATA_DIR / "card_scorecard_v1.csv"
RECOMMENDATIONS_FILE = DATA_DIR / "recommendations.csv"
CARD_MASTER_FILE = DATA_DIR / "card_master_table.csv"
COMMERCIAL_CANONICAL_FILE = DATA_DIR / "commercial_canonical_feature_matrix_v1.csv"

# LLM Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "models/gemini-2.5-flash"

