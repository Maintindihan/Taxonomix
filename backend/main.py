from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
import math
import numpy as np
import pandas as pd
import io
from pygbif import species 

app = FastAPI(title="Taxonomix API")

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


def detect_taxonomy_columns(df):
    """Identify columns containing taxonomic data"""
    tax_columns = []

    if 'speciesKey' in df.columns:
        df['speciesKey'] = df['speciesKey'].astype('Int64')  # Handles nulls

    for col in df.columns:
        col_lower = col.lower()
        if any(term in col_lower for term in ['species', 'genus', 'taxon', 'scientific']):
            tax_columns.append(col)
    return tax_columns or None

# --- API Endpoint ---
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # 1. Read with explicit encoding and BOM handling
        contents = await file.read()
        decoded = contents.decode('utf-8-sig').strip()
        df = pd.read_csv(
            io.StringIO(decoded),
            sep='\t',
            header=0,
            na_values=['NA', 'N/A', 'NaN', 'NULL', '', 'null', 'Null'],
            keep_default_na=False,
            dtype={'speciesKey': 'Int64', 'taxonKey': 'Int64'}
        )
        
        # 2. Verify we have data lines after header
        sample_data = []
        for _, row in df.head().iterrows():
            clean_row = {k: safe_serialize(v) for k, v in row.items()}
            sample_data.append(clean_row)

        # 4. Debug output to verify parsing
        print(f"Columns found: {list(df.columns)}")
        print(f"First row values: {df.iloc[0].to_dict()}")

        return {
            "filename": file.filename,
            "columns": list(df.columns),
            "taxonomy_columns_detected": detect_taxonomy_columns(df),
            "sample_data": jsonable_encoder(sample_data),
            "stats": {
                "total_rows": len(df),
                "non_null_rows": len(df.dropna(how='all'))
            }
        }

    except Exception as e:
        raise HTTPException(400, detail=f"Processing failed: {str(e)}")
    
@app.post("/api/csv")
async def upload_csv(file: UploadFile = File(...)):
    # Try to read as tab-separated first, fallback to comma
    try:
        df = pd.read_csv(file.file, sep='\t')
    except Exception:
        file.file.seek(0)
        df = pd.read_csv(file.file)
    
    data = {
        "filename": file.filename,
        "columns": df.columns.tolist(),
        "taxonomy_columns_detected": detect_taxonomy_columns(df),
        "sample_data": df.head(5).to_dict(orient="records"),
        "stats": {
            "total_rows": len(df),
            "non_null_rows": df.notnull().any(axis=1).sum()
        }
    }

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