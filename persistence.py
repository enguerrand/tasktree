from sqlalchemy import ForeignKey, create_engine, Table, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

DB_URL_DEV = "sqlite+pysqlite:///:memory:"


association_table_user_x_task_list = Table(
    "association_user_x_task_list",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("user.id")),
    Column("task_list_id", Integer, ForeignKey("task_list.id")),
)


association_table_task_x_tag = Table(
    "association_task_x_tag",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("task.id")),
    Column("tag_id", Integer, ForeignKey("tag.id")),
)

association_table_task_x_task = Table(
    "association_task_x_task",
    Base.metadata,
    Column("prereq_id", Integer, ForeignKey("task.id")),
    Column("dependent_id", Integer, ForeignKey("task.id")),
)


class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True)
    username = Column(String(30), unique=True, nullable=False)
    password = Column(String, nullable=False)
    task_lists = relationship("TaskList", secondary=association_table_user_x_task_list, back_populates="users")

    def __repr__(self):
        return f"User(id={self.id!r}, username={self.username!r}, password={self.password!r})"


class TaskList(Base):
    __tablename__ = "task_list"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    users = relationship("User", secondary=association_table_user_x_task_list, back_populates="task_lists")
    tasks = relationship("Task", back_populates="task_list")

    def __repr__(self):
        return f"TaskList(id={self.id!r}, title={self.title!r})"


class Task(Base):
    __tablename__ = 'task'

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    # Column('created', Date?) # FIXME
    # Column('reminder', Date?) # FIXME
    description = Column(String)
    task_list = relationship("TaskList", back_populates="tasks")
    tags = relationship("Tag", secondary=association_table_task_x_tag, back_populates="tasks")
    prerequisites = relationship("Task", secondary=association_table_task_x_task, back_populates="depending_tasks")
    depending_tasks = relationship("Task", secondary=association_table_task_x_task, back_populates="prerequisites")

    def __repr__(self):
        return f"Task(id={self.id!r}, title={self.title!r})"


class Tag(Base):
    __tablename__ = 'tag'

    id = Column(
        Integer, primary_key=True
    )  # do not expose id over web api. OR: add column for list id to prevent tags leaking to other lists?
    title = Column(String, nullable=False)
    tasks = relationship("Task", secondary=association_table_task_x_tag, back_populates="tags")

    def __repr__(self):
        return f"Tag(id={self.id!r}, title={self.title!r})"


class Persistence:
    def __init__(self, db_url: str):
        self.engine = create_engine(DB_URL_DEV, echo=True, future=True)
        Base.metadata.create_all(self.engine)

    def hello(self, name: str):
        with self.engine.begin() as conn:
            pass
