from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import Session, select

from app.database import get_session
from app.models import Subtask

router = APIRouter(prefix="/subtasks")
templates = Jinja2Templates(directory="app/templates")


@router.post("/", response_class=HTMLResponse)
async def create_subtask(request: Request, session: Session = Depends(get_session)):
    form = await request.form()
    title = form.get("title", "").strip()
    task_id = int(form.get("task_id", 0))

    if not title or not task_id:
        return HTMLResponse("")

    existing = session.exec(select(Subtask).where(Subtask.task_id == task_id)).all()
    max_pos = max((s.position for s in existing), default=-1)

    subtask = Subtask(title=title, position=max_pos + 1, task_id=task_id)
    session.add(subtask)
    session.commit()
    session.refresh(subtask)

    return templates.TemplateResponse("partials/subtask_item.html", {"request": request, "subtask": subtask})


@router.post("/{subtask_id}/toggle", response_class=HTMLResponse)
async def toggle_subtask(subtask_id: int, request: Request, session: Session = Depends(get_session)):
    subtask = session.get(Subtask, subtask_id)
    if not subtask:
        return HTMLResponse("", status_code=404)

    subtask.completed = not subtask.completed
    session.add(subtask)
    session.commit()
    session.refresh(subtask)

    return templates.TemplateResponse("partials/subtask_item.html", {"request": request, "subtask": subtask})


@router.delete("/{subtask_id}")
async def delete_subtask(subtask_id: int, session: Session = Depends(get_session)):
    subtask = session.get(Subtask, subtask_id)
    if subtask:
        session.delete(subtask)
        session.commit()
    return HTMLResponse("")
