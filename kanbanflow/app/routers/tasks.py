from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import Session, select

from app.database import get_session
from app.models import Task

router = APIRouter(prefix="/tasks")
templates = Jinja2Templates(directory="app/templates")


@router.post("/", response_class=HTMLResponse)
async def create_task(request: Request, session: Session = Depends(get_session)):
    form = await request.form()
    title = form.get("title", "").strip()
    column_id = int(form.get("column_id", 0))
    description = form.get("description", "").strip()
    priority = form.get("priority", "medium")
    label = form.get("label", "")
    due_date = form.get("due_date", "") or None

    if not title or not column_id:
        return HTMLResponse("")

    tasks = session.exec(select(Task).where(Task.column_id == column_id)).all()
    max_pos = max((t.position for t in tasks), default=-1)

    task = Task(
        title=title,
        description=description,
        priority=priority,
        label=label,
        due_date=due_date,
        position=max_pos + 1,
        column_id=column_id,
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    return templates.TemplateResponse("partials/task_card.html", {"request": request, "task": task})


@router.get("/{task_id}/card", response_class=HTMLResponse)
async def get_task_card(task_id: int, request: Request, session: Session = Depends(get_session)):
    """Return a single task card (used to refresh card after modal edits)."""
    task = session.get(Task, task_id)
    if not task:
        return HTMLResponse("")
    return templates.TemplateResponse("partials/task_card.html", {"request": request, "task": task})


@router.get("/{task_id}/edit", response_class=HTMLResponse)
async def edit_task_form(task_id: int, request: Request, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        return HTMLResponse("", status_code=404)
    return templates.TemplateResponse("partials/task_modal.html", {"request": request, "task": task})


@router.put("/{task_id}", response_class=HTMLResponse)
async def update_task(task_id: int, request: Request, session: Session = Depends(get_session)):
    form = await request.form()
    task = session.get(Task, task_id)
    if not task:
        return HTMLResponse("", status_code=404)

    task.title = form.get("title", task.title).strip()
    task.description = form.get("description", task.description).strip()
    task.priority = form.get("priority", task.priority)
    task.label = form.get("label", task.label)
    task.due_date = form.get("due_date", task.due_date) or None

    session.add(task)
    session.commit()
    session.refresh(task)

    return templates.TemplateResponse("partials/task_card.html", {"request": request, "task": task})


@router.post("/move")
async def move_task(request: Request, session: Session = Depends(get_session)):
    """Handle drag-and-drop: move a task to a new column/position."""
    data = await request.json()
    task_id = int(data.get("task_id", 0))
    new_column_id = int(data.get("column_id", 0))
    new_position = int(data.get("position", 0))

    task = session.get(Task, task_id)
    if not task:
        return {"ok": False}

    old_column_id = task.column_id

    # Reorder tasks in the old column (if moving between columns)
    if old_column_id != new_column_id:
        old_tasks = session.exec(
            select(Task)
            .where(Task.column_id == old_column_id, Task.id != task_id)
            .order_by(Task.position)
        ).all()
        for i, t in enumerate(old_tasks):
            t.position = i
            session.add(t)

    # Insert into new column at position
    new_tasks = session.exec(
        select(Task)
        .where(Task.column_id == new_column_id, Task.id != task_id)
        .order_by(Task.position)
    ).all()

    task.column_id = new_column_id
    task.position = new_position

    for i, t in enumerate(new_tasks):
        pos = i if i < new_position else i + 1
        t.position = pos
        session.add(t)

    session.add(task)
    session.commit()

    return {"ok": True}


@router.delete("/{task_id}")
async def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if task:
        session.delete(task)
        session.commit()
    return HTMLResponse("")
