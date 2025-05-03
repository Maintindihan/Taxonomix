import pandas as pd
from pathlib import Path
import requests
import diskcache

cache = diskcache.Cache("gbif_cache")

GBIF_MATCH_URL = "https://api.gbif.org/v1/species/match"

def extract_unique_names_from_csv(csv_path: str, taxonomy_columns: list[str] = None) -> set[str]:
    df = pd.read_csv(csv_path, sep=None, engine='python')  # Smart delimiter detection
    if not taxonomy_columns:
        # Auto-detect columns with likely taxonomic names
        taxonomy_columns = [
            col for col in df.columns
            if any(word in col.lower() for word in ['species', 'genus', 'scientific', 'taxon']) and not col.lower().endswith("key")
        ]
    names = set()
    for col in taxonomy_columns:
        names.update(df[col].dropna().unique())
    return names

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
        
        # If GBIF returns a weak/conflicting match
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

def warm_cache_from_names(name_list: list[str]):
    total = len(name_list)
    for i, name in enumerate(name_list, 1):
        match = get_gbif_match_cached(name)
        status = "✔" if match else "✘"
        print(f"[{i}/{total}] {status} {name}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Preload GBIF cache from a CSV file.")
    parser.add_argument("csv_file", help="Path to CSV file")
    parser.add_argument("--columns", nargs="*", help="Optional list of taxonomy columns")

    args = parser.parse_args()
    csv_path = Path(args.csv_file)

    if not csv_path.exists():
        print(f"Error: {csv_path} does not exist.")
        exit(1)

    names = extract_unique_names_from_csv(str(csv_path), args.columns)
    print(f"Found {len(names)} unique names to warm cache.")

    warm_cache_from_names(sorted(names))
