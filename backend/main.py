from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
import math
import numpy as np
import pandas as pd
import io

app = FastAPI(title="Taxonomix API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Read file content
        contents = await file.read()
        
        # Read file with explicit tab delimiter
        df = pd.read_csv(
            io.StringIO(contents.decode('utf-8')),
            sep='\t',
            na_values=['NA', 'N/A', 'NaN', 'NULL', ''],
            keep_default_na=False
        )

        # Custom JSON serializer for problamatic values
        def safe_serialize(obj):
            if isinstance(obj, (float, np.floating)):
                if math.isnan(obj) or math.isinf(obj):
                    return None
                return round(obj, 10) # Limit the decimal places
            return obj
        
        # Clean and serialize the data
        clean_data = []
        for record in df.head().to_dict('records'):
            clean_record = {k: safe_serialize(v) for k,v in record.items()}
            clean_data.append(clean_record)
                

        # Clean data
        df = df.replace([np.inf, -np.inf], None)
        df = df.where(pd.notnull(df), None)
            
        return {
            "filename": file.filename,
            "columns": list(df.columns),
            "sample_data": jsonable_encoder(clean_data) 
        }
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Error processing file: {str(e)}"
        )
    
# In backend/main.py
# @app.post("/api/normalize")
# async def normalize_data(request: Request):
#     data = await request.json()
#     df = pd.DataFrame(data)
#     # Add normalization logic here
#     return {"normalized_data": df.to_dict()}

# @app.get("/api/download")
# async def download_file():
#     # Return cleaned data as CSV
#     return FileResponse("cleaned_data.csv")