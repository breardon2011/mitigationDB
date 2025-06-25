from fastapi import FastAPI
from routers import evaluate, rules
from db import init_db


app = FastAPI()

init_db()

app.include_router(evaluate.router, prefix="/api/v1")
app.include_router(rules.router)