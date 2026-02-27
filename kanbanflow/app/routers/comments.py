from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import Session

from app.database import get_session
from app.models import Comment

router = APIRouter(prefix="/comments")
templates = Jinja2Templates(directory="app/templates")


@router.post("/", response_class=HTMLResponse)
async def create_comment(request: Request, session: Session = Depends(get_session)):
    form = await request.form()
    text = form.get("text", "").strip()
    task_id = int(form.get("task_id", 0))

    if not text or not task_id:
        return HTMLResponse("")

    comment = Comment(text=text, task_id=task_id)
    session.add(comment)
    session.commit()
    session.refresh(comment)

    return templates.TemplateResponse("partials/comment_item.html", {"request": request, "comment": comment})


@router.delete("/{comment_id}")
async def delete_comment(comment_id: int, session: Session = Depends(get_session)):
    comment = session.get(Comment, comment_id)
    if comment:
        session.delete(comment)
        session.commit()
    return HTMLResponse("")
