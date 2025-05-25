import pandas as pd
import re
from typing import Dict, Callable, Optional

TAXONOMIC_KEYWORDS = [
    'species', 'genus', 'family', 'order', 'class', 'phylum', 'kingdom',
    'taxon', 'taxa', 'scientific'
]

AUTHORSHIP_PATTERN = re.compile(r'\(([^)]+, \d{4}(?:-\d{2})?)\)|[A-Z][a-zA-Z.]+\s*,\s*\d{4}(?:-\d{2})?')


def is_likely_taxonomic(value):
    """
    Determine if a value resembles a scientific taxonomic name, 
    such as genus, species, or a full binomial with author/year info. 
    """
    if not isinstance(value, str):
        return False
    
    value = value.strip()

    # Genus or family (single capitalized word)
    if re.match(r"^[A-Z][a-z]+$", value):
        return True
    
    # Match binomial with optional authorship, commas, parentheses, and initials
    if re.fullmatch(r"[A-Z][a-z]+ [a-z]+(?: \([^)]+\)| [A-Z][a-z]+,? \d{4}(-\d{2})?)?", value):
        return True
    
    return False     

def detect_taxonomy_columns(df, sample_size=100):
    """
    Automatically detect columns that are likely taxonomic based on sample content.
    """

    excluded_keywords = {"state", "province", "media", "type", "country", "date", "time"}

    tax_columns = []

    for col in df.columns:
        # Skip known non-taxonomic columns based on name
        if any(key in col.lower() for key in excluded_keywords):
            continue


        sample_values = df[col].dropna().astype(str).head(sample_size)
        score = sum(is_likely_taxonomic(v) for v in sample_values)
        if score / max(1, len(sample_values)) >= 0.05:
            tax_columns.append(col)

    return tax_columns

def column_has_authorship(sample: pd.Series) -> bool:
    """Returns True if sample series contains authorship-like strings."""
    return any(bool(AUTHORSHIP_PATTERN.search(str(val))) for val in sample.dropna().head(10))

def split_taxonomic_name(df: pd.DataFrame, column: str) -> pd.DataFrame:
    """Splits taxonomic name into canonical and authorship in a new column, only if authorship exists."""
    def split_name(name):
        if not isinstance(name, str):
            return name, None
        match = AUTHORSHIP_PATTERN.search(name)
        if match:
            authorship = match.group(0).strip()
            canonical = AUTHORSHIP_PATTERN.sub('', name).strip()
            return canonical, authorship
        return name.strip(), None

    # Apply the split
    canonical_and_authorship = df[column].apply(split_name)
    df[column] = canonical_and_authorship.apply(lambda x: x[0])
    authorship_series = canonical_and_authorship.apply(lambda x: x[1])

    # Only add _authorship column if there's at least one non-null and non-empty authorship
    if authorship_series.dropna().astype(str).str.strip().ne('').any():
        col_index = df.columns.get_loc(column)
        df.insert(col_index + 1, f"{column}_authorship", authorship_series)

    return df

def remove_authorship(name: str) -> str:
    """Removes authorship patterns from a string."""
    return AUTHORSHIP_PATTERN.sub('', str(name)).strip()

def clean_taxonomic_column(
        df: pd.DataFrame, 
        column: str, 
        name_map: Dict[str, str],
        on_progress: Optional[Callable[[], None]] = None) -> pd.DataFrame:
    """Cleans a single taxonomic column: normalize with GBIF, split authorship if present."""
    
    for idx in df.index:
        original = df.at[idx, column]
        normalized = name_map.get(original, original)
        df.at[idx, column] = normalized
        if on_progress:
            on_progress()

    # Use normalized values from GBIF or fallback to original
    # df[column] = df[column].map(name_map).fillna(df[column])

    # Sample post-normalization to determine if authorship still exists
    sample = df[column].dropna().astype(str).head(10)
    
    if column_has_authorship(sample):
        df = split_taxonomic_name(df, column)
    else:
        df[column] = df[column].apply(remove_authorship)
    
    return df