from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
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
    """Handle problematic JSON values"""
    try:
        if isinstance(obj, (float, np.floating)):
            if math.isnan(obj) or math.isinf(obj):
                return None
            return round(obj, 10)  # Limit decimal places
    except:
        return str(obj) # Fallback for any unserializable value

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

        # 3. Parse with strict validation

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
    
@app.post("/api/debug")
async def debug_upload(file: UploadFile = File(...)):
    contents = await file.read()

    return {
        "first_line": contents.decode('utf-8').split('\n')[0],
        "num_rows": len(contents.decode('utf-8').split('\n'))
    }