# data/loaders.py

import pandas as pd
from pathlib import Path

from data.cache import get_cached, set_cached
from data.schemas import (
    USERS_COLUMNS,
    FRAUD_COLUMNS,
    SEGMENTATION_COLUMNS,
    CARDS_COLUMNS,
    RECOMMENDATIONS_COLUMNS,
    CARD_MASTER_COLUMNS
)

DATA_DIR = Path(__file__).parent / "raw"


def _load_csv(name, columns):
    cached = get_cached(name)
    if cached is not None:
        return cached

    path = DATA_DIR / name
    df = pd.read_csv(path)

    # Enforce schema
    df = df[columns]

    set_cached(name, df)
    return df


def load_users():
    return _load_csv("users.csv", USERS_COLUMNS)


def load_fraud():
    return _load_csv("fraud.csv", FRAUD_COLUMNS)


def load_segmentation():
    return _load_csv("segmentation.csv", SEGMENTATION_COLUMNS)


def load_cards():
    return _load_csv("cards.csv", CARDS_COLUMNS)


def load_recommendations():
    return _load_csv("recommendations.csv", RECOMMENDATIONS_COLUMNS)


def load_card_master():
    return _load_csv("card_master_table.csv", CARD_MASTER_COLUMNS)