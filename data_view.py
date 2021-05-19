import json
from typing import List, Optional

from flask_login import UserMixin

from persistence import Persistence, Task, TaskList, User


class UserView(UserMixin):
    def __init__(self, user: User):
        self.id = user.id
        self.username = user.username

    def as_dict(self):
        return {"id": self.id, "username": self.username}


class ListView:
    def __init__(self, task_list: TaskList):
        self.id = task_list.id
        self.title = task_list.title
        self.tasks = [TaskView(task).as_dict() for task in task_list.tasks]

    def as_dict(self):
        return {"id": self.id, "title": self.title, "tasks": self.tasks}


class TaskView:
    def __init__(self, task: Task):
        self.task = task
        self.tags = [t.title for t in self.task.tags]

    def as_dict(self):
        return {
            "id": self.task.id,
            "title": self.task.title,
            "description": self.task.description,
            "created": self.task.created,
            "due": self.task.due,
            "completed": self.task.completed,
            "tags": self.tags,
        }


class DataView:
    def __init__(self, persistence: Persistence, viewing_user: User):
        self.persistence = persistence
        self.viewing_user = viewing_user

    def get_user(self, user_id: int) -> UserView:
        return UserView(self.persistence.get_user(user_id)).as_dict()

    def get_users(self) -> List[UserView]:
        return [UserView(user).as_dict() for user in self.persistence.get_users()]

    def get_task_list(self, task_list_id: int) -> ListView:
        task_list = self.persistence.get_task_list(self.viewing_user.id, task_list_id)
        return ListView(task_list).as_dict()

    def get_lists(self) -> List[ListView]:
        return [ListView(task_list).as_dict() for task_list in self.persistence.get_task_lists(self.viewing_user.id)]

    def create_or_replace_list(self, task_list_id: int, json_request):
        title = json_request["title"]
        self.persistence.create_or_replace_task_list(task_list_id, title, self.viewing_user.id)

    def create_or_update_task(self, task_list_id: int, task_id: int, json_request):
        prev_task = json_request.get("prev")
        next_task = json_request["next"]

        requesting_user_id = self.viewing_user.id
        if prev_task is None:
            self.persistence.create_task(
                requesting_user_id,
                task_id,
                task_list_id,
                next_task["title"],
                next_task["due"],
                next_task["description"]
                # TODO: tags + dependencies
            )
        else:
            self.persistence.update_task(
                task_id,
                prev_task["title"],
                prev_task["due"],
                prev_task["description"],
                next_task["title"],
                next_task["due"],
                next_task["description"],
                requesting_user_id,
            )
