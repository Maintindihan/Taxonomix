import pandas as pd
import numpy as np
import math

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
