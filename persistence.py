import os
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, create_engine, Table, Column, Integer, String, select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship


Base = declarative_base()

DB_NAME = "tasktree.db"
DB_URL_DEV = "sqlite+pysqlite:///:memory:"
DB_URL_PROD = "sqlite+pysqlite:///%s" % DB_NAME


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

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(30), unique=True, nullable=False)
    password = Column(String, nullable=False)
    task_lists = relationship("TaskList", secondary=association_table_user_x_task_list, back_populates="users")

    def __repr__(self):
        return f"User(id={self.id!r}, username={self.username!r}, password={self.password!r})"


class TaskList(Base):
    __tablename__ = "task_list"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    users = relationship("User", secondary=association_table_user_x_task_list, back_populates="task_lists")
    tasks = relationship("Task", backref="task_list")

    def __repr__(self):
        return f"TaskList(id={self.id!r}, title={self.title!r})"


class Task(Base):
    __tablename__ = "task"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    created = Column("created", DateTime, nullable=False, default=datetime.utcnow)
    due = Column("due", DateTime, nullable=True)
    description = Column(String)
    task_list_id = Column(Integer, ForeignKey("task_list.id"))
    tags = relationship("Tag", secondary=association_table_task_x_tag, back_populates="tasks")
    prerequisites = relationship(
        "Task",
        secondary=association_table_task_x_task,
        back_populates="depending_tasks",
        foreign_keys=[association_table_task_x_task.c.prereq_id],
    )
    depending_tasks = relationship(
        "Task",
        secondary=association_table_task_x_task,
        back_populates="prerequisites",
        foreign_keys=[association_table_task_x_task.c.dependent_id],
    )

    def __repr__(self):
        return f"Task(id={self.id!r}, title={self.title!r})"


class Tag(Base):
    __tablename__ = "tag"

    id = Column(
        Integer, primary_key=True, autoincrement=True
    )  # do not expose id over web api. OR: add column for list id to prevent tags leaking to other lists?
    title = Column(String, nullable=False)
    tasks = relationship("Task", secondary=association_table_task_x_tag, back_populates="tags")

    def __repr__(self):
        return f"Tag(id={self.id!r}, title={self.title!r})"


class Persistence:
    def __init__(self, db_url: str):
        self.engine = create_engine(db_url, echo=True, future=True)

    def create(self):
        Base.metadata.create_all(self.engine)

    def create_user(self, username: str, password: str):
        with Session(self.engine) as session:
            user = User(username=username, password=password)
            session.add(user)
            session.commit()

    def get_users(self):
        users = []
        with Session(self.engine) as session:
            for row in session.execute(select(User)):
                if len(row) >= 1:
                    users.append(row[0])
        return users

    def get_user(self, username: str) -> User:
        stmt = select(User).where(User.username == username)
        with Session(self.engine) as session:
            row = session.execute(stmt).first()
            if row is None or len(row) < 1:
                return None
            return row[0]

    def create_task_list(self, title: str, creating_user_id: int):
        # FIXME impl
        pass

    def change_task_list_title(self, task_list_id: int, prev_title: str, next_title: str, creating_user_id: int):
        # FIXME impl
        # FIXME access control
        pass

    def share_task_list_with(self, task_list_id: int, user_id: int):
        # FIXME impl
        # FIXME access control
        pass

    def remove_task_list(self, task_list_id: int):
        # FIXME impl
        # FIXME delete contained tasks
        # FIXME potentially also delete orphaned tags
        # FIXME access control
        pass

    def create_task(
        self,
        task_list_id: int,
        title: str,
        due=None,
        description=None,
        prereq_task_ids=[],
        depending_task_ids=[],
        tags=[],
    ):
        # FIXME impl
        # FIXME Access control for task_list_ids and task_ids for prereq and depending tasks
        pass

    def move_task_to_list(self, task_list_id: int, from_task_list_id: int, to_task_list_id: int):
        # FIXME impl
        # FIXME Access control for task_list_ids and task_ids for prereq and depending tasks
        pass

    def update_task(
        self,
        task_id: int,
        prev_title: str,
        prev_due: DateTime,
        prev_description: str,
        next_title: str,
        next_due: DateTime,
        next_description: str,
    ):
        # FIXME impl
        # FIXME Access control for task_ids for prereq and depending tasks
        pass

    def remove_task(self, task_id):
        # FIXME impl
        # FIXME Access control for task_ids for prereq and depending tasks
        # FIXME delete orphaned tasks
        pass

    def get_visible_tags(self, user_id: int):
        # FIXME query: user_id -> lists -> tasks -> tags
        pass

    def add_tag(self, task_id: int, tag: str):
        # FIXME impl
        # FIXME Access control for task_ids
        pass

    def remove_tag(self, task_id: int, tag: str):
        # FIXME impl
        # FIXME Access control for task_ids
        # FIXME delete tag if no references to it are left
        pass

    def add_prerequisite(self, task_id: int, prerequisite_task_id: int):
        # FIXME impl
        # FIXME Access control for task_ids
        pass

    def remove_prerequisite(self, task_id: int, prerequisite_task_id: int):
        # FIXME impl
        # FIXME Access control for task_ids
        pass

    def add_dependent(self, task_id: int, dependent_id: int):
        # FIXME impl
        # FIXME Access control for task_ids
        pass

    def remove_dependent(self, task_id: int, dependent_id: int):
        # FIXME impl
        # FIXME Access control for task_ids
        pass


if __name__ == "__main__":
    os.remove(DB_NAME)
    persistence = Persistence(DB_URL_PROD)
    persistence.create()
    persistence.create_user("edr", "foobar")  # FIXME remove test code
