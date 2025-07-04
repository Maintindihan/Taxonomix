from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router

app = FastAPI(title="Taxonomix API")

origins = [
    "https://taxonomix.net",
    "https://www.taxonomix.net",
    "https://api.taxonomix.net",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or ["*"] during testing
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


