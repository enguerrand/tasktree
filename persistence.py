import os
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, create_engine, Table, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship, scoped_session, sessionmaker

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


class EditConflictException(Exception):
    def __init__(self, current_server_value):
        self.current_server_value = current_server_value


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
        self.session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=self.engine))

    def create(self):
        Base.metadata.create_all(self.engine)

    def create_user(self, username: str, password: str):
        user = User(username=username, password=password)
        self.session.add(user)
        self.session.commit()

    def get_users(self):
        return self.session.query(User).all()

    def get_user(self, username: str) -> User:
        return self.session.query(User).filter(User.username == username).one()

    def create_task_list(self, title: str, requesting_user_id: int):
        user = self.session.query(User).filter(User.id == requesting_user_id).one()
        task_list = TaskList(title=title, users=[user])
        self.session.add(task_list)
        self.session.commit()

    def get_task_lists(self, requesting_user_id: int):
        return self.session.query(TaskList).join(TaskList.users).filter(User.id == requesting_user_id).all()

    def change_task_list_title(self, task_list_id: int, prev_title: str, next_title: str, requesting_user_id: int):
        task_list = (
            self.session.query(TaskList)
                .join(TaskList.users)
                .filter(User.id == requesting_user_id)
                .filter(TaskList.id == task_list_id)
                .one()
        )
        if task_list.title != prev_title:
            raise EditConflictException(task_list)

        task_list.title = next_title
        self.session.commit()

    def share_task_list_with(self, task_list_id: int, user_to_add_id: int, requesting_user_id: int):
        user_to_add = self.session.query(User).filter(User.id == user_to_add_id).one()
        task_list = (
            self.session.query(TaskList)
                .join(TaskList.users)
                .filter(User.id == requesting_user_id)
                .filter(TaskList.id == task_list_id)
                .one()
        )
        task_list.users.append(user_to_add)
        self.session.commit()

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
