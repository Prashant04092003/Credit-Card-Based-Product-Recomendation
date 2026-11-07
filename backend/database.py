import duckdb
from backend.config import BASE_DIR

DB_PATH = BASE_DIR / "data" / "credit360.duckdb"

class Database:
    _instance = None

    def __init__(self):
        # Connect in read-only mode for high concurrency
        self.con = duckdb.connect(str(DB_PATH), read_only=True)
        
        # Load reference dataframes into memory for instant O(1) dictionary lookups
        self.users_master = self.con.execute("SELECT * FROM users_master").df()
        self.cards_master = self.con.execute("SELECT * FROM cards_master").df()
        self.segmentation = self.con.execute("SELECT * FROM segmentation").df()
        self.card_scorecard = self.con.execute("SELECT * FROM card_scorecard").df()
        self.recommendations = self.con.execute("SELECT * FROM recommendations").df()
        self.card_master = self.con.execute("SELECT * FROM card_master").df()
        self.commercial_catalog = self.con.execute("SELECT * FROM commercial_catalog").df()

    def get_cursor(self):
        """Returns an isolated thread cursor to avoid concurrent query collisions."""
        return self.con.cursor()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = Database()
        return cls._instance

db = Database.get_instance()
