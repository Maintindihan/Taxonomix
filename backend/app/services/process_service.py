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
    redis_client.hset(f"task:{task_id}", mapping=updates)

def process_csv_in_background(task_id: str, input_path: str):
    try:
        update_task_status(task_id, status="processing", percent=10)

        df = pd.read_csv(input_path)

        tax_columns = detect_taxonomy_columns(df)
        if not tax_columns:
            update_task_status(task_id, status="error", message="No taxonomic columns found.")
            return

        update_task_status(task_id, percent=25)
        name_map = normalize_scientific_names(df, tax_columns)

        update_task_status(task_id, percent=60)
        for col in tax_columns:
            df = clean_taxonomic_column(df, col, name_map)

        update_task_status(task_id, percent=85)
        warm_gbif_cache_df(df.copy(), tax_columns)

        output_dir = "output"
        os.makedirs(output_dir, exist_ok=True)
        filename = os.path.basename(input_path)
        output_path = os.path.join(output_dir, filename)
        df.to_csv(output_path, index=False)

        update_task_status(task_id, status="done", percent=100)

    except Exception as e:
        update_task_status(task_id, status="error", message=str(e))