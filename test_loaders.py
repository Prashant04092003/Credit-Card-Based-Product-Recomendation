from data.loaders import (
    load_users,
    load_fraud,
    load_segmentation,
    load_cards,
    load_recommendations,
    load_card_master
)

def test_users():
    df = load_users()
    print("USERS")
    print(df.shape)
    print(df.columns)
    print(df.head(), "\n")

def test_fraud():
    df = load_fraud()
    print("FRAUD")
    print(df.shape)
    print(df.columns)
    print(df.head(), "\n")

def test_segmentation():
    df = load_segmentation()
    print("SEGMENTATION")
    print(df.shape)
    print(df.columns)
    print(df.head(), "\n")

def test_cards():
    df = load_cards()
    print("CARDS")
    print(df.shape)
    print(df.columns)
    print(df.head(), "\n")

def test_recommendations():
    df = load_recommendations()
    print("RECOMMENDATIONS")
    print(df.shape)
    print(df.columns)
    print(df.head(), "\n")

def test_card_master():
    df = load_card_master()
    print("CARD MASTER")
    print(df.shape)
    print(df.columns)
    print(df.head(), "\n")


if __name__ == "__main__":
    test_users()
    test_fraud()
    test_segmentation()
    test_cards()
    test_recommendations()
    test_card_master()