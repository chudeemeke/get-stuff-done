from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import Session

from app.database import get_session
from app.models import Column

router = APIRouter(prefix="/columns")
templates = Jinja2Templates(directory="app/templates")


@router.post("/", response_class=HTMLResponse)
async def create_column(request: Request, session: Session = Depends(get_session)):
    form = await request.form()
    title = form.get("title", "").strip()
    board_id = int(form.get("board_id", 0))
    color = form.get("color", "#6366f1")

    if not title or not board_id:
        return HTMLResponse("")

    # Get max position for this board
    from sqlmodel import select

    cols = session.exec(select(Column).where(Column.board_id == board_id)).all()
    max_pos = max((c.position for c in cols), default=-1)

    col = Column(title=title, color=color, position=max_pos + 1, board_id=board_id)
    session.add(col)
    session.commit()
    session.refresh(col)

    return templates.TemplateResponse("partials/column.html", {"request": request, "col": col})


@router.put("/{column_id}")
async def update_column(column_id: int, request: Request, session: Session = Depends(get_session)):
    form = await request.form()
    col = session.get(Column, column_id)
    if not col:
        return HTMLResponse("", status_code=404)

    title = form.get("title")
    color = form.get("color")
    if title:
        col.title = title.strip()
    if color:
        col.color = color
    session.add(col)
    session.commit()
    session.refresh(col)
    return templates.TemplateResponse("partials/column.html", {"request": request, "col": col})


@router.delete("/{column_id}")
async def delete_column(column_id: int, session: Session = Depends(get_session)):
    col = session.get(Column, column_id)
    if col:
        session.delete(col)
        session.commit()
    return HTMLResponse("")
