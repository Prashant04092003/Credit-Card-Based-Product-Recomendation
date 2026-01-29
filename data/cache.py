# data/cache.py

_DATA_CACHE = {}

def get_cached(name):
    return _DATA_CACHE.get(name)

def set_cached(name, df):
    _DATA_CACHE[name] = df