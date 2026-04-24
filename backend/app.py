"""FastAPI application entrypoint."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.followup import router as followup_router
from routes.predict import router as predict_router

app = FastAPI(
    title="Behavioral Lie Detection System API",
    version="1.0.0",
    description="Behavioral inference API for scenario-based deception risk estimation.",
)

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Handle ALLOWED_ORIGINS from environment, defaulting to '*' for maximum compatibility
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
configured_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
allowed_origins = configured_origins or ["*"]

# If "*" is in allowed_origins, we must set allow_credentials=False
allow_all = "*" in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=not allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

# Add a global exception handler to ensure CORS headers are present on all errors
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
    
    # Manually add CORS headers to error responses
    origin = request.headers.get("origin")
    if origin:
        if "*" in allowed_origins or origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin if "*" not in allowed_origins else "*"
            response.headers["Access-Control-Allow-Credentials"] = "true" if "*" not in allowed_origins else "false"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
            
    return response

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # Log the full error for debugging in Render
    print(f"UNEXPECTED ERROR: {str(exc)}")
    import traceback
    traceback.print_exc()
    
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )
    
    # Manually add CORS headers
    origin = request.headers.get("origin")
    if origin:
        if "*" in allowed_origins or origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin if "*" not in allowed_origins else "*"
            response.headers["Access-Control-Allow-Credentials"] = "true" if "*" not in allowed_origins else "false"
            
    return response

app.include_router(predict_router)
app.include_router(followup_router)
