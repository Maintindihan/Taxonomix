from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router

app = FastAPI(title="Taxonomix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://taxonomix.net",
        "https://www.taxonomix.net",
        "https://api.taxonomix.net",
        "https://taxonomix.onrender.com", 
        "https://taxonomix-frontend.onrender.com",  
        "https://taxonomix.onrender.com",           
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/ping")
def ping():
    return {"message": "pong"}


