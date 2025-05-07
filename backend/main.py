from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
import math
import numpy as np
import pandas as pd
import os
import io
from io import StringIO
from pygbif import species
import re 
import requests
import diskcache

cache = diskcache.Cache("gbif_cache")

app = FastAPI(title="Taxonomix API")

GBIF_MATCH_URL = "https://api.gbif.org/v1/species/match"

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Core Functions ---
def safe_serialize(obj):
    """Convert problematic types to JSON-safe types"""
    try:
        if isinstance(obj, (np.integer,)):  # np.int64, np.int32, etc.
            return int(obj)
        elif isinstance(obj, (np.floating, float)):
            if math.isnan(obj) or math.isinf(obj):
                return None
            return round(float(obj), 10)
        elif isinstance(obj, (np.ndarray,)):  # convert arrays to lists
            return obj.tolist()
        elif isinstance(obj, (pd.Timestamp, pd.Timedelta)):
            return str(obj)
        elif isinstance(obj, (pd.NaT.__class__, type(None))):
            return None
        else:
            return str(obj)
    except:
        return str(obj)

def detect_delimiter(sample_text, candidates=[',', '\t', ';', '|']):
    """
    Detect the most likely delimiter by checking consistency across lines.
    """
    delimiter_scores = {}
    lines = sample_text.splitlines()
    
    for delimiter in candidates:
        counts = [line.count(delimiter) for line in lines if line]
        if counts:
            variance = np.var(counts)
            mean = np.mean(counts)
            # Low variance and high mean = consistent structured delimiter
            score = mean / (variance + 1e-6)
            delimiter_scores[delimiter] = score

    return max(delimiter_scores, key=delimiter_scores.get) if delimiter_scores else ','

def read_csv_smart(file):
    """
    Read a CSV file intelligently by auto-detecting delimiters and fixing encoding.
    Accepts a file-like object.
    """
    pos = file.tell()
    sample = file.read(4096).decode('utf-8-sig', errors='ignore')
    file.seek(pos)

    delimiters = [detect_delimiter(sample)] + [',', '\t', ';', '|']
    tried = set()

    for delim in delimiters:
        if delim in tried:
            continue
        tried.add(delim)
        try:
            file.seek(0)
            df = pd.read_csv(
                file,
                sep=delim,
                header=0,
                na_values=['NA', 'N/A', 'NaN', 'NULL', '', 'null', 'Null'],
                keep_default_na=False,
                dtype={'speciesKey': 'Int64', 'taxonKey': 'Int64'},
                encoding='utf-8-sig'
            )
            print(f"✅ Successfully parsed using delimiter: {repr(delim)}")
            return df
        except pd.errors.ParserError:
            continue  # Try next delimiter
        except Exception as e:
            raise e  # Unexpected errors
    
    raise ValueError("Failed to parse file with any known delimiter.")

def is_likely_taxonomic(value):
    """
    Determine if a value resembles a scientific taxonomic name, 
    such as genus, species, or a full binomial with author/year info. 
    """
    if not isinstance(value, str):
        return False
    
    value = value.strip()

    # Genus or family (single capitalized word)
    if re.match(r"^[A-Z][a-z]+$", value):
        return True
    
    # Match binomial with optional authorship, commas, parentheses, and initials
    if re.fullmatch(r"[A-Z][a-z]+ [a-z]+(?: \([^)]+\)| [A-Z][a-z]+,? \d{4}(-\d{2})?)?", value):
        return True
    
    return False     

def detect_taxonomy_columns(df, sample_size=100):
    """
    Automatically detect columns that are likely taxonomic based on sample content.
    """

    excluded_keywords = {"state", "province", "media", "type", "country", "date", "time"}

    tax_columns = []

    for col in df.columns:
        # Skip known non-taxonomic columns based on name
        if any(key in col.lower() for key in excluded_keywords):
            continue


        sample_values = df[col].dropna().astype(str).head(sample_size)
        score = sum(is_likely_taxonomic(v) for v in sample_values)
        if score / max(1, len(sample_values)) >= 0.05:
            tax_columns.append(col)

    return tax_columns

# def split_authorship(df, column):
#     """
#     If a column contains authorship, move it to a new column and clean the original.
#     """
#     new_col = f"{column}_authorship"

#     def extract_name_and_author(val):
#         match = re.match(r"^([A-Z][a-z]+ [a-z]+) \((.+)\)$", str(val))
#         if match:
#             name, author = match.groups()
#             return name, author
#         return val, None
    
    # names, authors = zip(*df[column].map(extract_name_and_author))
    # df[column] = names
    # df[new_col] = authors

    # return df

def split_taxonomic_name(df: pd.DataFrame, tax_columns: List[str]) -> pd.DataFrame:
    """
    Splits a scientific name into components. 
    Returns: (genus, species, authorship)
    """
    pattern = r"^(.*?)(?:\s+\(([^)]+)\)|\s+([^,]+,\s*\d{4}))?$"

    for col in tax_columns:
        cleaned = df[col].astype(str).str.extract(pattern)
        cleaned_name = cleaned[0].str.strip()
        authorship = cleaned[1].fillna(cleaned[2]).fillna("").str.strip()
                                       
        df[col] = cleaned_name
        df[f"{col}_authorship"] = authorship.where(authorship != "", None)

    return df

# def enrich_taxonomy_columns(df, tax_columns):
#     for col in tax_columns:
#         genus_list, species_list, authorship_list = [], [], []

#         for val in df[col].astype(str):
#             genus, species, author = split_taxonomic_name(val)
#             genus_list.append(genus)
#             species_list.append(species)
#             authorship_list.append(author)

#         df[f"{col}_genus"] = genus_list
#         df[f"{col}_species"] = species_list
#         df[f"{col}_authorship"] = authorship_list

#     return df

def apply_name_map(df, tax_columns, name_map):
    for col in tax_columns:
        new_vals = []
        for val in df[col]:
            if isinstance(val, str):
                genus = val.split(" ")[0]
                if genus in name_map:
                    val = val.replace(genus, name_map[genus], 1)
            new_vals.append(val)
        
        df[col] = new_vals

    return df

def extract_scientific_names(df, tax_columns):
    names = set()
    for col in tax_columns:
        values = df[col].dropna().astype(str).unique()
        for val in values:
            parts = val.strip().split()
            if 1 <= len(parts) <= 3:
                names.add(val.strip())
    return list(names)

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

def normalize_name(name):
    try:
        # GBIF API under the hood uses requests — inject timeout via kwargs
        result = species.name_backbone(name, timeout=5)  # 5 seconds max
        if 'usageKey' in result and result['matchType'] != 'NONE':
            return result.get('scientificName', name)
        else:
            return name
    except requests.exceptions.Timeout:
        print(f"Timeout on name: {name}")
        return name
    except Exception as e:
        print(f"Error on name: {name} → {e}")
        return name
    
def apply_name_normalization(df, name_map, tax_columns):
    for col in tax_columns:
        df[col] = df[col].apply(lambda x: name_map.get(str(x), x))
    return df

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

def gbif_match_name(name):
    url = f"https://api.gbif.org/v1/species/match"
    params = {"name": name}
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            if data.get("matchType") != "NONE" and data.get("confidence", 0) > 80:
                return data.get("scientificName", name)
        return name
    except Exception:
        return name
    
def apply_gbif_normalization(df, tax_columns):
    name_map = {}
    for col in tax_columns:
        unique_values = df[col].dropna().unique()
        for name in unique_values:
            normalized = gbif_match_name(name)
            if name != normalized:
                name_map[name] = normalized
        df[col]  = df[col].apply(lambda x: name_map.get(x, x))
    return df, name_map

def warm_gbif_cache_from_df(df: pd.DataFrame, tax_columns: list[str]):
    unique_names = set()

    for col in tax_columns:
        col_vals = df[col].dropna().astype(str).unique()
        for val in col_vals:
            if val.strip() and not val.lower().endswith("key"):
                unique_names.add(val.strip())

    for name in unique_names:
        get_gbif_match_cached(name)

# def normalize_taxonomy_dataframe(df):
#     tax_columns = detect_taxonomy_columns(df)

#     # Remove authorship into adjacent columns
#     for col in tax_columns:
#         df = split_authorship(df, col)

#     # Apply GBIF normalization
#     df, name_map = apply_gbif_normalization(df, tax_columns)

#     # return df, tax_columns, name_map
#     return df, tax_columns, name_map

# For csv files only at the moment
@app.post("/api/csv")
async def upload_csv(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Try to read as tab-separated first, fallback to comma
    df = read_csv_smart(file.file)
    
    tax_columns = detect_taxonomy_columns(df)

    if tax_columns:
        # Split authorship into a new columnn next to the original
        # df = enrich_taxonomy_columns(df, tax_columns)
        df = split_taxonomic_name(df, tax_columns)

        # Cache warm in the backgroudn
        background_tasks.add_task(warm_gbif_cache_from_df, df.copy(), tax_columns)

        name_map = normalize_scientific_names(df, tax_columns)
        df = apply_name_normalization(df, name_map, tax_columns)

    # Create output directory if one does not exist
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    # Define the file path
    safe_name = f"{file.filename}"
    file_path = os.path.join(output_dir, safe_name)

    # Save the file to disk
    df.to_csv(file_path, index=False)

    # Return a downloadable response
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachement; filename={safe_name}"}
    )


# For csv files only at the moment
@app.post("/api/csvtojson")
async def json_response(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # Try to read as tab-separated first, fallback to comma
    df = read_csv_smart(file.file)
    
    tax_columns = detect_taxonomy_columns(df)

    if tax_columns:
        # Split authorship into a new columnn next to the original
        df = enrich_taxonomy_columns(df, tax_columns)

        # Cache warm in the backgroudn
        background_tasks.add_task(warm_gbif_cache_from_df, df.copy(), tax_columns)

        name_map = normalize_scientific_names(df, tax_columns)
        df = apply_name_normalization(df, name_map, tax_columns)

        authorship_columns = [f"{col}_authorship" for col in tax_columns if f"{col}_authorship" in df.columns]
    else:
        name_map = {}
        authorship_columns = []

    relevant_columns = tax_columns + authorship_columns
    sample_data = df.head(5).to_dict(orient="records")

    data = {
        "filename": file.filename,
        "columns": df.columns.tolist(),
        "taxonomy_columns_detected": tax_columns,
        "authorship_columns": authorship_columns,
        "name_map": name_map,
        "relevacious_data_gurl": relevant_columns,
        "sample_data": sample_data,
        "stats": {
            "total_rows": len(df),
            "non_null_rows": df.notnull().any(axis=1).sum()
        }
    }

    # Serialize and return JSON response
    encoded_data = jsonable_encoder(
        data, 
        custom_encoder={
            float: safe_serialize,
            int: safe_serialize,
            np.integer: safe_serialize,
            np.floating: safe_serialize,
            np.ndarray: safe_serialize,
            pd.Timestamp: safe_serialize,
            pd.Timedelta: safe_serialize,
            type(pd.NaT): safe_serialize,
        }
    )

    return JSONResponse(content=encoded_data)