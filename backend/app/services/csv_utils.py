import pandas as pd
import numpy as np

def detect_delimiter(sample_text, candidates=[',', '\t', ';', '|']):
    """
    Detect the most likely delimiter by checking consistency across lines.
    """
    delimiter_scores = {}
    lines = sample_text.splitlines()
    
    for delimiter in candidates:
        counts = [line.count(delimiter) for line in lines if line]
        if counts:
            variance = np.var(counts)
            mean = np.mean(counts)
            # Low variance and high mean = consistent structured delimiter
            score = mean / (variance + 1e-6)
            delimiter_scores[delimiter] = score

    return max(delimiter_scores, key=delimiter_scores.get) if delimiter_scores else ','

def read_csv_smart(file):
    """
    Read a CSV file intelligently by auto-detecting delimiters and fixing encoding.
    Accepts a file-like object.
    """
    pos = file.tell()
    sample = file.read(4096).decode('utf-8-sig', errors='ignore')
    file.seek(pos)

    delimiters = [detect_delimiter(sample)] + [',', '\t', ';', '|']
    tried = set()

    for delim in delimiters:
        if delim in tried:
            continue
        tried.add(delim)
        try:
            file.seek(0)
            df = pd.read_csv(
                file,
                sep=delim,
                header=0,
                na_values=['NA', 'N/A', 'NaN', 'NULL', '', 'null', 'Null'],
                keep_default_na=False,
                dtype={'speciesKey': 'Int64', 'taxonKey': 'Int64'},
                encoding='utf-8-sig'
            )
            print(f"✅ Successfully parsed using delimiter: {repr(delim)}")
            return df
        except pd.errors.ParserError:
            continue  # Try next delimiter
        except Exception as e:
            raise e  # Unexpected errors
    
    raise ValueError("Failed to parse file with any known delimiter.")
