from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router
from fastapi.responses import JSONResponse, Response
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import request_validation_exception_handler
from app.services.redis_client import redis_client  # If not already imported

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

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    response = await request_validation_exception_handler(request, exc)
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("origin", "*")
    return response


@app.options("/create-payment-intent")
async def preflight_handler():
    return Response(status_code=200, headers={
        "Access-Control-Allow-Origin": "https://taxonomix.net",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })

@app.get("/redis-ping")
def redis_ping():
    try:
        redis_client.set("hello", "world")
        val = redis_client.get("hello")
        return {"success": True, "value": val}
    except Exception as e:
        return {"success": False, "error": str(e)}

