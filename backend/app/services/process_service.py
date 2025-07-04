import os
import pandas as pd
import time
from app.services.redis_client import redis_client
from app.services.gbif_service import normalize_scientific_names, warm_gbif_cache_df
from app.services.taxonomy_utils import detect_taxonomy_columns, clean_taxonomic_column

def update_task_status(task_id: str, status: str = None, percent: int = None, message: str = None):
    updates = {}
    if status: updates["status"] = status
    if percent is not None: updates["percent"] = str(percent)
    if message: updates["message"] = message

    print(f"📝 Updating Redis for task:{task_id} => {updates}")
    redis_client.hset(f"task:{task_id}", mapping=updates)

def process_csv_in_background(task_id: str, input_path: str):
    try:
        print(f"🚀 Starting background task for {task_id} and file {input_path}")
        # update_task_status(task_id, status="processing", percent=10)

        df = pd.read_csv(input_path)

        tax_columns = detect_taxonomy_columns(df)
        if not tax_columns:
            update_task_status(task_id, status="error", message="No taxonomic columns found.")
            return

        # update_task_status(task_id, percent=25)
        total_rows = len(df)
        total_cells = total_rows * len(tax_columns)

        cleaned_cells = [0]

        def on_progress():
            cleaned_cells[0] += 1
            percent = int((cleaned_cells[0] / total_cells) * 100)
            update_task_status(task_id, percent=percent)

        name_map = normalize_scientific_names(df, tax_columns)


        # update_task_status(task_id, percent=60)
        for col in tax_columns:
            df = clean_taxonomic_column(df, col, name_map, on_progress=on_progress)

        warm_gbif_cache_df(df.copy(), tax_columns)

        output_dir = "output"
        os.makedirs(output_dir, exist_ok=True)
        filename = os.path.basename(input_path)
        output_path = os.path.join(output_dir, filename)
        df.to_csv(output_path, index=False)

        update_task_status(task_id, status="done", percent=100)

        redis_client.hset(f"task:{task_id}", mapping={
            "status":"done",
            "percent":"100",
        })

    except Exception as e:
        update_task_status(task_id, status="error", message=str(e))
        redis_client.hset(f"tast:{task_id}", mapping={
            "status": "error",
            "percent": "0",
            "message":str(e)
        })