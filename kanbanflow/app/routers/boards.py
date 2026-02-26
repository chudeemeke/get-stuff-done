from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import Session, select

from app.database import get_session
from app.models import Board, Column

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

DEFAULT_COLUMNS = [
    ("Backlog", "#8b5cf6", 0),
    ("To Do", "#6366f1", 1),
    ("In Progress", "#f59e0b", 2),
    ("Review", "#3b82f6", 3),
    ("Done", "#10b981", 4),
]


@router.get("/", response_class=HTMLResponse)
async def home(request: Request, session: Session = Depends(get_session)):
    boards = session.exec(select(Board)).all()
    return templates.TemplateResponse("index.html", {"request": request, "boards": boards})


@router.post("/boards")
async def create_board(request: Request, session: Session = Depends(get_session)):
    form = await request.form()
    name = form.get("name", "").strip()
    description = form.get("description", "").strip()
    if not name:
        return RedirectResponse("/", status_code=303)

    board = Board(name=name, description=description)
    session.add(board)
    session.commit()
    session.refresh(board)

    for title, color, pos in DEFAULT_COLUMNS:
        col = Column(title=title, color=color, position=pos, board_id=board.id)
        session.add(col)
    session.commit()

    return RedirectResponse(f"/boards/{board.id}", status_code=303)


@router.get("/boards/{board_id}", response_class=HTMLResponse)
async def view_board(request: Request, board_id: int, session: Session = Depends(get_session)):
    board = session.get(Board, board_id)
    if not board:
        return RedirectResponse("/", status_code=303)
    return templates.TemplateResponse("board.html", {"request": request, "board": board})


@router.delete("/boards/{board_id}")
async def delete_board(board_id: int, session: Session = Depends(get_session)):
    board = session.get(Board, board_id)
    if board:
        session.delete(board)
        session.commit()
    return HTMLResponse("")
