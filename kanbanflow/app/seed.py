"""Seed the database with realistic sample data."""
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.database import engine
from app.models import Board, Column, Comment, Subtask, Task

# Dates relative to now
_now = datetime.now(timezone.utc)
_today = _now.strftime("%Y-%m-%d")
_yesterday = (_now - timedelta(days=1)).strftime("%Y-%m-%d")
_3_days_ago = (_now - timedelta(days=3)).strftime("%Y-%m-%d")
_in_2_days = (_now + timedelta(days=2)).strftime("%Y-%m-%d")
_in_5_days = (_now + timedelta(days=5)).strftime("%Y-%m-%d")
_in_7_days = (_now + timedelta(days=7)).strftime("%Y-%m-%d")
_in_14_days = (_now + timedelta(days=14)).strftime("%Y-%m-%d")
_a_week_ago = (_now - timedelta(days=7)).strftime("%Y-%m-%d")


SEED_DATA = {
    "board": {
        "name": "Product Launch v2.0",
        "description": "Ship the next major release — features, fixes, and polish",
    },
    "columns": [
        ("Backlog", "#8b5cf6", 0),
        ("To Do", "#6366f1", 1),
        ("In Progress", "#f59e0b", 2),
        ("Review", "#3b82f6", 3),
        ("Done", "#10b981", 4),
    ],
    # column_index, title, description, priority, label, due_date, subtasks, comments
    "tasks": [
        # -- Backlog --
        (0, "Dark mode color audit", "Review all components for proper dark mode contrast ratios", "low", "chore", _in_14_days,
         [("Check nav colors", False), ("Check card backgrounds", False), ("Check form inputs", False), ("Check modal overlays", False)],
         ["Flagged during last design review"]),

        (0, "Add keyboard shortcuts", "Implement common shortcuts: Ctrl+N for new task, Escape to close modals, etc.", "low", "feature", None,
         [("Define shortcut map", False), ("Add event listeners", False), ("Show shortcut hints in UI", False)],
         []),

        (0, "Improve mobile drag-and-drop", "Touch interactions feel janky on iOS Safari", "medium", "bug", None,
         [],
         ["Users on mobile are complaining", "SortableJS has touch delay options we haven't tuned"]),

        # -- To Do --
        (1, "User authentication system", "Add login/signup with session-based auth. Start with email+password.", "high", "feature", _in_7_days,
         [("Design login/signup pages", False), ("Set up user model", False), ("Password hashing with bcrypt", False), ("Session middleware", False), ("Protect board routes", False)],
         ["Should we use OAuth too or just email/pass for now?", "Email/pass first, OAuth in a follow-up"]),

        (1, "Export board to JSON", "Let users download their board data as structured JSON", "medium", "feature", _in_5_days,
         [("Define export schema", False), ("Add export endpoint", False), ("Add download button to UI", False)],
         []),

        (1, "Fix task reorder glitch", "When dragging a task to position 0, it sometimes lands at position 1", "high", "bug", _in_2_days,
         [],
         ["Reproduced in Chrome and Firefox", "Looks like an off-by-one in the move endpoint"]),

        # -- In Progress --
        (2, "Subtask completion animations", "Add satisfying micro-animations when checking off subtasks", "medium", "feature", _in_5_days,
         [("CSS transition for checkbox", True), ("Strikethrough text animation", True), ("Progress bar smooth transition", False), ("Confetti on 100% complete", False)],
         ["Keep it subtle — no jarring motion", "Progress bar transition is already working, just needs easing"]),

        (2, "Refactor task card component", "The task card template is getting unwieldy. Break into smaller partials.", "medium", "chore", _today,
         [("Extract badge partial", True), ("Extract footer partial", False), ("Extract subtask progress partial", False)],
         ["Will make it easier to A/B test different card layouts"]),

        # -- Review --
        (3, "Column color picker upgrade", "Replace native color input with a custom palette picker", "low", "feature", _yesterday,
         [("Build color palette component", True), ("Wire up to column create form", True), ("Wire up to column edit", True), ("Add custom hex input fallback", False)],
         ["Looks great in dark mode", "Should we add a 'reset to default' option?"]),

        (3, "Fix overdue date not highlighting", "Due dates in the past should appear red — verify the JS detection works", "urgent", "bug", _3_days_ago,
         [("Check markOverdueDates() logic", True), ("Test with various date formats", True), ("Verify after HTMX swap", False)],
         ["This was broken because the class wasn't being applied after dynamic content load", "Fixed — also added re-run on htmx:afterSwap"]),

        # -- Done --
        (4, "Set up project structure", "Initialize FastAPI app with HTMX, Tailwind, SortableJS", "high", "chore", _a_week_ago,
         [("FastAPI + uvicorn", True), ("Jinja2 templates", True), ("Tailwind via CDN", True), ("HTMX integration", True), ("SortableJS for drag-drop", True)],
         ["Clean architecture with routers, models, templates separation"]),

        (4, "Board CRUD operations", "Create, view, and delete boards with default columns", "high", "feature", _a_week_ago,
         [("Create board form", True), ("Board list page", True), ("Board detail view", True), ("Delete board", True), ("Default columns on create", True)],
         []),

        (4, "Task CRUD + drag-and-drop", "Full task lifecycle with drag between columns", "high", "feature", _3_days_ago,
         [("Create task in column", True), ("Edit task modal", True), ("Delete task", True), ("Drag between columns", True), ("Reorder within column", True)],
         ["Drag-and-drop feels solid", "Modal close refreshes the card correctly now"]),
    ],
}


def seed_db():
    """Populate the database with sample data if it's empty."""
    with Session(engine) as session:
        existing = session.exec(select(Board)).first()
        if existing:
            return False  # Already seeded

        # Board
        board = Board(**SEED_DATA["board"])
        session.add(board)
        session.commit()
        session.refresh(board)

        # Columns
        cols = []
        for title, color, pos in SEED_DATA["columns"]:
            col = Column(title=title, color=color, position=pos, board_id=board.id)
            session.add(col)
            cols.append(col)
        session.commit()
        for col in cols:
            session.refresh(col)

        # Tasks, subtasks, comments
        for col_idx, title, desc, priority, label, due_date, subtask_list, comment_list in SEED_DATA["tasks"]:
            col = cols[col_idx]
            tasks_in_col = [t for t in SEED_DATA["tasks"] if t[0] == col_idx]
            pos = next(i for i, t in enumerate(tasks_in_col) if t[1] == title)

            task = Task(
                title=title,
                description=desc,
                priority=priority,
                label=label,
                due_date=due_date,
                position=pos,
                column_id=col.id,
            )
            session.add(task)
            session.commit()
            session.refresh(task)

            for st_pos, (st_title, st_done) in enumerate(subtask_list):
                subtask = Subtask(title=st_title, completed=st_done, position=st_pos, task_id=task.id)
                session.add(subtask)

            for c_text in comment_list:
                comment = Comment(text=c_text, task_id=task.id)
                session.add(comment)

            session.commit()

        return True


if __name__ == "__main__":
    from app.database import init_db
    init_db()
    if seed_db():
        print("Database seeded with sample data.")
    else:
        print("Database already has data, skipping seed.")
