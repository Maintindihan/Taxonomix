import os
import pandas as pd
import uuid
import stripe
from dotenv import load_dotenv
load_dotenv()
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Request, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from app.services.redis_client import redis_client
from app.services.csv_utils import read_csv_smart
from app.services.gbif_service import normalize_scientific_names, warm_gbif_cache_df
from app.services.taxonomy_utils import detect_taxonomy_columns, clean_taxonomic_column
from app.services.process_service import process_csv_in_background
from app.services.progress_tracker import progress


router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY") # Store this securely in your .env

@router.post("/api/csv")
async def upload_csv(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    df = read_csv_smart(file.file)
    safe_name = file.filename

    output_dir = "uploads"
    os.makedirs(output_dir, exist_ok=True)
    input_path = os.path.join(output_dir, safe_name)
    df.to_csv(input_path, index=False)
    
    task_id = str(uuid.uuid4())

    total_names = len(df)  # Count total rows for progress

    redis_client.hset(f"task:{task_id}", mapping={
        "status": "processing",
        "percent": "0",
        "filename": safe_name,
        "total" : total_names
    })

    # Start background processing
    background_tasks.add_task(process_csv_in_background, task_id, input_path)

    return {"message": "Processing started",
            "task_id": task_id,
            "filename": safe_name,
            "total": total_names
    }

@router.get("/download/{filename}")
def download_file(filename: str):
    output_dir = "output"
    file_path = os.path.join(output_dir, filename)

    if not os.path.isfile(file_path):
        return JSONResponse(status_code=404, content={"message": "File not found"})

    return FileResponse(
        file_path, 
        filename=filename
    )

# @router.get("/progress/{filename}")
# def get_progress(filename: str):
#     if filename not in progress:
#         return JSONResponse(status_code=404, content={"error": "No progress found"})
#     return {"progress": progress[filename]}

@router.get("/progress/{task_id}")
def get_progress(task_id: str):
    redis_key = f"task:{task_id}"
    print(f"Checking progress for: {redis_key}")
    progress_data = redis_client.hgetall(redis_key)
    print(f" Redis data: {progress_data}")

    if not progress_data:
        # Instead of failing, return status="pending" with 0%
        return {
            "status": "pending",
            "progress": 0
        }

    return {
        "status": progress_data.get("status", "unknown"),
        "progress": int(progress_data.get("percent", 0)),
        "message": progress_data.get("message", "")
    }

@router.post("/create-payment-intent")
async def create_payment_intent(request: Request):
    data = await request.json()
    amount = data.get("amount")
    card_name = data.get("cardName")

    if not  amount:
        raise HTTPException(status_code=400, detail="Missing amount")

    try:
        intent = stripe.PaymentIntent.create(
            amount=amount, 
            currency="usd",
            payment_method_types=["card"]
        )
        return {"clientSecret" : intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

