import os
import pandas as pd
from app.services.gbif_service import normalize_scientific_names, warm_gbif_cache_df
from app.services.taxonomy_utils import detect_taxonomy_columns, clean_taxonomic_column
from app.services.progress_tracker import progress

def process_csv_in_background(filename: str):
    try:
        input_path = os.path.join("uploads", filename)
        df = pd.read_csv(input_path)

        progress[filename]["percent"] = 10

        tax_columns = detect_taxonomy_columns(df)
        if not tax_columns:
            progress[filename] = {"status": "error", "message": "No taxonomic columns found."}
            return

        progress[filename]["percent"] = 25
        name_map = normalize_scientific_names(df, tax_columns)

        progress[filename]["percent"] = 60
        for col in tax_columns:
            df = clean_taxonomic_column(df, col, name_map)

        progress[filename]["percent"] = 85
        warm_gbif_cache_df(df.copy(), tax_columns)

        output_dir = "output"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, filename)
        df.to_csv(output_path, index=False)

        progress[filename] = {"status": "done", "percent": 100}

    except Exception as e:
        progress[filename] = {"status": "error", "message": str(e)}
