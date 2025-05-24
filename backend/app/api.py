import os
import pandas as pd
import uuid
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from app.services.redis_client import redis_client
from app.services.csv_utils import read_csv_smart
from app.services.gbif_service import normalize_scientific_names, warm_gbif_cache_df
from app.services.taxonomy_utils import detect_taxonomy_columns, clean_taxonomic_column
from app.services.process_service import process_csv_in_background
from app.services.progress_tracker import progress

router = APIRouter()

@router.post("/api/csv")
async def upload_csv(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    df = read_csv_smart(file.file)
    safe_name = file.filename

    output_dir = "uploads"
    os.makedirs(output_dir, exist_ok=True)
    input_path = os.path.join(output_dir, safe_name)
    df.to_csv(input_path, index=False)
    
    task_id = str(uuid.uuid4())
    redis_client.hset(f"task:{task_id}", mapping={
        "status": "processing",
        "percent": "0",
        "filename": safe_name
    })

    # Start background processing
    background_tasks.add_task(process_csv_in_background, task_id, input_path)

    return {"message": "Processing started",
            "task_id": task_id,
            "filename": safe_name
    }

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

# @router.get("/progress/{filename}")
# def get_progress(filename: str):
#     if filename not in progress:
#         return JSONResponse(status_code=404, content={"error": "No progress found"})
#     return {"progress": progress[filename]}

@router.get("/progress/{task_id}")
def get_progress(task_id: str):
    key = f"task: {task_id}"
    progress_data = redis_client.hgetall(key)

    print(f"Checking progress for:  {key}")
    print(f" Redis data: {progress_data}")

    if not progress_data:
        raise HTTPException(status_code=404, detail="Progress not available")

    return {
        "progress": int(progress_data.get("percent", 0)),
        "status": progress_data.get("status", "unknown"),
        "message": progress_data.get("message", "")
    }
