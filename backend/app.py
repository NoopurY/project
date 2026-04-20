"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.followup import router as followup_router
from routes.predict import router as predict_router

app = FastAPI(
    title="Behavioral Lie Detection System API",
    version="1.0.0",
    description="Behavioral inference API for scenario-based deception risk estimation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(predict_router)
app.include_router(followup_router)
