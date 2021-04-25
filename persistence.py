import os
from datetime import datetime
from typing import List, Optional

from passlib.handlers.pbkdf2 import pbkdf2_sha256
from sqlalchemy import DateTime, ForeignKey, and_, create_engine, Table, Column, Integer, String, delete
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Query, relationship, scoped_session, sessionmaker

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
    completed = Column("completed", DateTime, nullable=True)
    description = Column(String, nullable=False, default="")
    task_list_id = Column(Integer, ForeignKey("task_list.id"))
    tags = relationship("Tag", backref="task")
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


class TaskConflict(Base):
    __tablename__ = "task_conflict"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    task_id = Column(Integer, ForeignKey("task.id"))
    task = relationship("Task", backref="conflicts")
    user_id = Column(Integer, ForeignKey("user.id"))
    user = relationship("User", backref="conflicts")


class Tag(Base):
    __tablename__ = "tag"

    id = Column(
        Integer, primary_key=True, autoincrement=True
    )  # do not expose id over web api. OR: add column for list id to prevent tags leaking to other lists?
    title = Column(String, nullable=False)
    task_id = Column(Integer, ForeignKey("task.id"))

    def __repr__(self):
        return f"Tag(id={self.id!r}, title={self.title!r})"


class Persistence:
    def __init__(self, db_url: str):
        self.engine = create_engine(db_url, echo=False, future=True)
        self.session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=self.engine))

    def create(self):
        Base.metadata.create_all(self.engine)

    def create_user(self, username: str, password: str):
        password_hash = pbkdf2_sha256.hash(password)
        user = User(username=username, password=password_hash)
        self.session.add(user)
        self.session.commit()

    def get_users(self):
        return self.session.query(User).all()

    def get_user(self, user_id: int) -> User:
        return self.session.query(User).filter(User.id == user_id).one()

    def get_user_by_name(self, username: str) -> User:
        return self.session.query(User).filter(User.username == username).one()

    def get_authenticated_user_by_name(self, username: str, password: str) -> Optional[User]:
        try:
            user = self.get_user_by_name(username)
        except NoResultFound:
            return None
        if not pbkdf2_sha256.verify(password, user.password):
            return None
        return user

    def create_task_list(self, title: str, requesting_user_id: int):
        user = self.session.query(User).filter(User.id == requesting_user_id).one()
        task_list = TaskList(title=title, users=[user])
        self.session.add(task_list)
        self.session.commit()

    def get_task_lists(self, requesting_user_id: int):
        return self.session.query(TaskList).join(TaskList.users).filter(User.id == requesting_user_id).all()

    def set_task_list_title(self, task_list_id: int, title: str, requesting_user_id: int):
        task_list = self.get_task_list(requesting_user_id, task_list_id)
        task_list.title = title
        self.session.commit()

    def share_task_list_with(self, task_list_id: int, user_to_add_id: int, requesting_user_id: int):
        user_to_add = self.session.query(User).filter(User.id == user_to_add_id).one()
        task_list = self.get_task_list(requesting_user_id, task_list_id)
        task_list.users.append(user_to_add)
        self.session.commit()

    def query_task_lists(self, requesting_user_id: int):
        return self.session.query(TaskList).join(TaskList.users).filter(User.id == requesting_user_id)

    def get_task_list(self, requesting_user_id: int, task_list_id: int):
        task_list = self.query_task_lists(requesting_user_id).filter(TaskList.id == task_list_id).one()
        return task_list

    def remove_task_list(self, task_list_id: int):
        # FIXME impl
        # FIXME delete contained tasks
        # FIXME potentially also delete orphaned tags
        # FIXME access control
        pass

    def create_task(
        self,
        requesting_user_id: int,
        task_list_id: int,
        title: str,
        due=None,
        description=None,
        prereq_task_ids=[],
        depending_task_ids=[],
        tags=[],
    ):
        task_list = self.get_task_list(requesting_user_id, task_list_id)
        prereq = self.query_tasks(requesting_user_id).filter(Task.id.in_(prereq_task_ids)).all()
        dependents = self.query_tasks(requesting_user_id).filter(Task.id.in_(depending_task_ids)).all()
        task = Task(title=title, due=due, description=description, task_list=task_list)
        task.prerequisites.extend(prereq)
        task.depending_tasks.extend(dependents)
        self.session.add(task)
        self.session.commit()
        # FIXME Tags

    def query_tasks(self, requesting_user_id: int):
        return self.session.query(Task).join(Task.task_list).join(TaskList.users).filter(User.id == requesting_user_id)

    def query_task_conflicts(self, requesting_user_id: int, task_id=None):
        conflicts_query = self.session.query(TaskConflict).filter(TaskConflict.user_id == requesting_user_id)
        if task_id is None:
            return conflicts_query
        return conflicts_query.filter(TaskConflict.task_id == task_id)

    def get_task(self, task_id: int, requesting_user_id: int):
        return self.query_tasks(requesting_user_id).filter(Task.id == task_id).one()

    def get_task_conflict(self, requesting_user_id: int, task_id: int) -> Optional[TaskConflict]:
        return self.query_task_conflicts(requesting_user_id, task_id).limit(1).one_or_none()

    def get_task_conflicts(self, requesting_user_id: int) -> List[TaskConflict]:
        return self.query_task_conflicts(requesting_user_id).all()

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
        requesting_user_id: int,
    ):
        task = self.get_task(task_id, requesting_user_id)
        task.due = self.merge_date(task.due, prev_due, next_due)
        self.session.execute(
            delete(TaskConflict)
            .where(and_(TaskConflict.user_id == requesting_user_id, TaskConflict.task_id == task.id))
            .execution_options(synchronize_session="fetch")
        )

        title_conflicts = prev_title != task.title
        description_conflicts = prev_description != task.description
        if title_conflicts:
            conflict_title = next_title
        else:
            conflict_title = None
            task.title = next_title
        if description_conflicts:
            conflict_description = next_description
        else:
            conflict_description = None
            task.description = next_description

        if title_conflicts or description_conflicts:
            self.session.add(
                TaskConflict(
                    user_id=requesting_user_id, task_id=task.id, title=conflict_title, description=conflict_description
                )
            )
        self.session.commit()

    # FIXME implement dependency edit

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

    def merge_date(self, old: DateTime, expected_old: DateTime, wanted_new: DateTime):
        if old == expected_old:  # no conflict
            return wanted_new
        if expected_old == wanted_new:  # no change requested
            return old
        if old is None:  # someone else removed the date and we changed it
            return wanted_new
        if wanted_new is None:  # we requested a date removal and someone else changed it
            return old
        if old < wanted_new:  # two simultaneous edits, use the earlier date
            return old
        else:
            return wanted_new


if __name__ == "__main__":
    os.remove(DB_NAME)
    persistence = Persistence(DB_URL_PROD)
    persistence.create()
    persistence.create_user("edr", "foobar")  # FIXME remove test code
