from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.database import init_db
from app.routers import boards, columns, tasks, subtasks, comments
from app.seed import seed_db

app = FastAPI(title="KanbanFlow", version="1.0.0")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(boards.router)
app.include_router(columns.router)
app.include_router(tasks.router)
app.include_router(subtasks.router)
app.include_router(comments.router)


@app.on_event("startup")
def on_startup():
    init_db()
    seed_db()
