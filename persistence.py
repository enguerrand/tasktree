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
        return f"User(id={self.id!r}, username={self.username!r}, password=***)"


class TaskList(Base):
    __tablename__ = "task_list"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    users = relationship("User", secondary=association_table_user_x_task_list, back_populates="task_lists")
    tasks = relationship("Task", backref="task_list", cascade="all, delete")

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
    tags = relationship("Tag", backref="task", cascade="all, delete")
    prerequisites = relationship(
        "Task",
        secondary=association_table_task_x_task,
        primaryjoin=association_table_task_x_task.c.dependent_id == id,
        secondaryjoin=association_table_task_x_task.c.prereq_id == id,
        backref="depending_tasks",
    )

    def __repr__(self):
        return f"Task(id={self.id!r}, task_list_id={self.task_list_id!r}, title={self.title!r}, description={self.description!r}, created={self.created!r}, due={self.due!r}, completed={self.completed!r})"


class TaskConflict(Base):
    __tablename__ = "task_conflict"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=True)
    description = Column(String, nullable=True)
    task_id = Column(Integer, ForeignKey("task.id"))
    task = relationship("Task", backref="conflicts", cascade="all, delete")
    user_id = Column(Integer, ForeignKey("user.id"))
    user = relationship("User", backref="conflicts", cascade="all, delete")

    def __repr__(self):
        return f"TaskConflict(id={self.id!r}, user_id={self.user_id!r}, task_id: {self.task_id!r}, title={self.title!r}, description={self.description!r})"


class Tag(Base):
    __tablename__ = "tag"

    id = Column(
        Integer, primary_key=True, autoincrement=True
    )  # do not expose id over web api. OR: add column for list id to prevent tags leaking to other lists?
    title = Column(String, nullable=False)
    task_id = Column(Integer, ForeignKey("task.id"))

    def __repr__(self):
        return f"Tag(id={self.id!r}, title={self.title!r}, task_id:{self.task_id!r})"


class Persistence:
    def __init__(self, db_url: str):
        self.engine = create_engine(db_url, echo=True, future=True)
        self.session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=self.engine))

    def create(self):
        Base.metadata.create_all(self.engine)

    def create_user(self, username: str, password: str):
        password_hash = pbkdf2_sha256.hash(password)
        user = User(username=username, password=password_hash)
        self.session.add(user)
        self.session.commit()

    def get_users(self) -> List[User]:
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

    def get_task_lists(self, requesting_user_id: int) -> List[TaskList]:
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

    def get_task_list(self, requesting_user_id: int, task_list_id: int) -> TaskList:
        task_list = self.query_task_lists(requesting_user_id).filter(TaskList.id == task_list_id).one()
        return task_list

    def remove_task_list(self, requesting_user_id: int, task_list_id: int):
        task_list = self.get_task_list(requesting_user_id, task_list_id)
        self.session.delete(task_list)
        self.session.commit()

    def create_task(
        self,
        requesting_user_id: int,
        task_list_id: int,
        title: str,
        due=None,
        description=None,
        prereq_task_ids=(),
        depending_task_ids=(),
        tags=(),
    ):
        task_list = self.get_task_list(requesting_user_id, task_list_id)
        prereq = self.query_tasks(requesting_user_id).filter(Task.id.in_(prereq_task_ids)).all()
        dependents = self.query_tasks(requesting_user_id).filter(Task.id.in_(depending_task_ids)).all()
        task = Task(title=title, due=due, description=description, task_list=task_list)
        task.prerequisites.extend(prereq)
        task.depending_tasks.extend(dependents)
        for t in tags:
            task.tags.append(Tag(title=t))
        self.session.add(task)
        self.session.commit()

    def query_tasks(self, requesting_user_id: int):
        return self.session.query(Task).join(Task.task_list).join(TaskList.users).filter(User.id == requesting_user_id)

    def query_task_conflicts(self, requesting_user_id: int, task_id=None):
        conflicts_query = self.session.query(TaskConflict).filter(TaskConflict.user_id == requesting_user_id)
        if task_id is None:
            return conflicts_query
        return conflicts_query.filter(TaskConflict.task_id == task_id)

    def get_task(self, requesting_user_id: int, task_id: int) -> Task:
        return self.query_tasks(requesting_user_id).filter(Task.id == task_id).one()

    def get_task_conflict(self, requesting_user_id: int, task_id: int) -> Optional[TaskConflict]:
        return self.query_task_conflicts(requesting_user_id, task_id).limit(1).one_or_none()

    def get_task_conflicts(self, requesting_user_id: int) -> List[TaskConflict]:
        return self.query_task_conflicts(requesting_user_id).all()

    def move_task_to_list(self, requesting_user_id: int, task_id: int, from_task_list_id: int, to_task_list_id: int):
        task_to_move = self.get_task(requesting_user_id, task_id)
        src_list = self.get_task_list(requesting_user_id, from_task_list_id)
        dst_list = self.get_task_list(requesting_user_id, to_task_list_id)
        if task_to_move not in src_list.tasks:
            raise NoResultFound()
        src_list.tasks.remove(task_to_move)
        dst_list.tasks.append(task_to_move)

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
        task = self.get_task(requesting_user_id, task_id)
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

    def complete_task(self, requesting_user_id: int, task_id: int):
        to_complete = self.get_task(requesting_user_id, task_id)
        if to_complete.due is None:
            to_complete.due = datetime.utcnow()
        self.session.commit()

    def un_complete_task(self, requesting_user_id: int, task_id: int):
        to_un_complete = self.get_task(requesting_user_id, task_id)
        to_un_complete.due = None
        self.session.commit()

    def get_tags(self, requesting_user_id: int, task_id: int) -> List[str]:
        return self.get_task(requesting_user_id, task_id).tags

    def add_tag(self, requesting_user_id: int, task_id: int, tag: str):
        to_edit = self.get_task(requesting_user_id, task_id)
        to_edit.tags.append(Tag(title=tag))
        self.session.commit()

    def remove_tag(self, requesting_user_id: int, task_id: int, tag: str):
        task = self.get_task(requesting_user_id, task_id)
        for t in task.tags:
            if t.title == tag:
                self.session.delete(t)
        self.session.commit()

    def add_dependency(self, requesting_user_id: int, prereq_id: int, dependent_id: int):
        pre: Task = self.get_task(requesting_user_id, prereq_id)  # just to check access permission
        dep = self.get_task(requesting_user_id, dependent_id)  # just to check access permission
        pre.depending_tasks.append(dep)
        self.session.commit()

    def remove_dependency(self, requesting_user_id: int, prereq_id: int, dependent_id: int):
        task = self.get_task(requesting_user_id, prereq_id)
        for dep in task.depending_tasks:
            if dep.id == dependent_id:
                task.depending_tasks.remove(dep)
        self.session.commit()

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
    # FIXME remove test code
    persistence.create_user("edr", "foobar")
    u = persistence.get_user_by_name("edr")
    persistence.create_task_list("First list", u.id)
    persistence.create_task_list("Second list", u.id)
    for tl in persistence.get_task_lists(u.id):
        for i in (1, 2, 3, 4):
            persistence.create_task(
                u.id, tl.id, f"task {i}", description=f"Description of task {i} in list " + tl.title
            )
        for task in tl.tasks:
            if task.id % 2 == 0:
                task.tags.append(Tag(title="even"))
            else:
                task.tags.append(Tag(title="uneven"))
            if task.id % 3 == 0:
                task.tags.append(Tag(title="multiple of 3"))

        persistence.session.commit()
