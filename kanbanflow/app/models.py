from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class Board(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    columns: list["Column"] = Relationship(
        back_populates="board",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "Column.position"},
    )


class Column(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    position: int = 0
    color: str = "#6366f1"  # indigo default
    board_id: int = Field(foreign_key="board.id")

    board: Optional[Board] = Relationship(back_populates="columns")
    tasks: list["Task"] = Relationship(
        back_populates="column",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "order_by": "Task.position"},
    )


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str = ""
    priority: str = "medium"  # low, medium, high, urgent
    label: str = ""  # feature, bug, chore, etc.
    due_date: Optional[str] = None
    position: int = 0
    column_id: int = Field(foreign_key="column.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    column: Optional[Column] = Relationship(back_populates="tasks")
