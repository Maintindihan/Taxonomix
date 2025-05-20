import requests
import pandas as pd
from diskcache import Cache
from pygbif import species

cache = Cache('./gbif_cache')
GBIF_MATCH_URL = "https://api.gbif.org/v1/species/match"
    
def get_gbif_match(name:str) -> dict | None:
    """
    Query the GBIF species match API directly. 
    """
    try:
        response = requests.get(GBIF_MATCH_URL, params={"name": name}, timeout=5)
        response.raise_for_status()
        data = response.json()

        # This allows for only strong matches. May need to write more nuanced code in the future
        if data.get("matchType") in {"EXACT", "FUZZY"} and "scientificName" in data:
            return data
        
        # If GBIF returns a week/conflicting match
        return None
    
    except requests.RequestException as e:
        print(f"GBIF lookup failed for {name}: {e}")
        return None
    
def  get_gbif_match_cached(name: str) -> dict | None:
    """
    Check the cache firest before calling the GBIF API
    """
    if name in cache:
        return cache[name]
    
    result = get_gbif_match(name)

    if result:
        cache[name] = result # Only if the match is succesful

    return result

def normalize_scientific_names(df: pd.DataFrame, tax_columns: list[str]) -> dict:
    """
    Normalize scientific names across specified taxonomy columns using GBIF cached matches. 
    """

    name_map = {}

    for col in tax_columns:
        unique_names = df[col].dropna().unique()

        for name in unique_names:
            match = get_gbif_match_cached(name)
            if match and "scientificName" in match:
                norm_name = match["scientificName"]
                if norm_name != name:
                    name_map[name] = norm_name
    
    return name_map


def warm_gbif_cache_df(df: pd.DataFrame, tax_columns: list[str]):
    unique_names = set()

    for col in tax_columns:
        col_vals = df[col].dropna().astype(str).unique()
        for val in col_vals:
            if val.strip() and not val.lower().endswith("key"):
                unique_names.add(val.strip())

    for name in unique_names:
        get_gbif_match_cached(name)