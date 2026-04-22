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

raw_origins = os.getenv("ALLOWED_ORIGINS", "")
configured_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
allowed_origins = configured_origins or default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(predict_router)
app.include_router(followup_router)
