from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import evaluate, rules
from db import init_db


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

init_db()

app.include_router(evaluate.router, prefix="/api/v1")
app.include_router(rules.router)