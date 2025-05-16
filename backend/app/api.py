import os
import pandas as pd
from fastapi import APIRouter, BackgroundTasks, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from app.services.csv_utils import read_csv_smart
from app.services.gbif_service import normalize_scientific_names, warm_gbif_cache_df
from app.services.taxonomy_utils import detect_taxonomy_columns, clean_taxonomic_column


router = APIRouter()

@router.post("/api/csv")
async def upload_csv(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    df = read_csv_smart(file.file)
    
    tax_columns = detect_taxonomy_columns(df)
    if not tax_columns:
        return {"message": "No taxonomic columns found."}

    name_map = normalize_scientific_names(df, tax_columns)

    for col in tax_columns:
        df = clean_taxonomic_column(df, col, name_map)

    background_tasks.add_task(warm_gbif_cache_df, df.copy(), tax_columns)

    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    safe_name = f"{file.filename}"
    file_path = os.path.join(output_dir, safe_name)
    df.to_csv(file_path, index=False)

    return JSONResponse(
        content={"message": "Upload successful!", "filename": safe_name}
    )

@router.get("/download/{filename}")
def download_file(filename: str):
    output_dir = "output"
    file_path = os.path.join(output_dir, filename)

    if not os.path.isfile(file_path):
        return JSONResponse(status_code=404, content={"message": "File not found"})

    return FileResponse(
        path=file_path, 
        media_type="text/csv", 
        filename=filename
    )
