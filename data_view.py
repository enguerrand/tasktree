import json
from datetime import datetime
from json import JSONDecodeError
from typing import List

from flask_login import UserMixin

from persistence import Persistence, Task, TaskConflict, TaskList, User


class UserView(UserMixin):
    def __init__(self, user: User):
        self.id = user.id
        self.username = user.username
        try:
            self.settings = json.loads(user.settings)
        except JSONDecodeError as e:
            print(f"json decode error while decoding settings of user {user.id}: {e}")
            self.settings = {}

    def as_dict(self):
        return {"id": self.id, "username": self.username, "settings": self.settings}


class ListView:
    def __init__(self, task_list: TaskList, conflicts):
        self.id = task_list.id
        self.title = task_list.title
        self.tasks = [TaskView(task, conflicts.get(task.id)).as_dict() for task in task_list.tasks]
        self.users = [user.username for user in task_list.users]

    def as_dict(self):
        return {"id": self.id, "title": self.title, "tasks": self.tasks, "users": self.users}


class TaskView:
    def __init__(self, task: Task, conflict: TaskConflict):
        self.task = task
        # this is somewhat counter intuitive: in the view we swap "actual" values with conflicting values because
        # the conflict caused by the user is stored as such, but from the user's point of view the conflicting
        # value is the one he did *not* write himself.
        if conflict is None or conflict.title is None:
            self.title = task.title
            self.conflicting_title = None
        else:
            self.title = conflict.title
            self.conflicting_title = task.title
        if conflict is None or conflict.description is None:
            self.description = task.description
            self.conflicting_description = None
        else:
            self.description = conflict.description
            self.conflicting_description = task.description
        self.tags = [t.title for t in self.task.tags]
        self.prerequisites = [t.id for t in self.task.prerequisites]
        self.depending_tasks = [t.id for t in self.task.depending_tasks]

    def as_dict(self):
        return {
            "id": self.task.id,
            "title": self.title,
            "conflictingTitle": self.conflicting_title,
            "description": self.description,
            "conflictingDescription": self.conflicting_description,
            "created": self.task.created.timestamp() * 1000,
            "due": nullable_date_to_timestamp(self.task.due),
            "completed": self.task.completed,
            "tags": self.tags,
            "prerequisites": self.prerequisites,
            "dependingTasks": self.depending_tasks,
        }


class DataView:
    def __init__(self, persistence: Persistence, viewing_user: User):
        self.persistence = persistence
        self.viewing_user = viewing_user

    def get_user(self, user_id: int) -> UserView:
        return UserView(self.persistence.get_user(user_id)).as_dict()

    def get_users(self) -> List[UserView]:
        return [UserView(user).as_dict() for user in self.persistence.get_users()]

    def store_settings(self, settings):
        self.persistence.store_user_settings(self.viewing_user.id, settings)

    def get_task_list(self, task_list_id: int) -> ListView:
        self.persistence.get_task_conflicts()
        task_list = self.persistence.get_task_list(self.viewing_user.id, task_list_id)
        return ListView(task_list).as_dict()

    def get_lists(self) -> List[ListView]:
        conflicts = self.persistence.get_task_conflicts_as_map(self.viewing_user.id)
        return [
            ListView(task_list, conflicts).as_dict()
            for task_list in self.persistence.get_task_lists(self.viewing_user.id)
        ]

    def create_or_replace_list(self, task_list_id: int, json_request):
        title = json_request["title"]
        users = json_request["users"]
        self.persistence.create_or_replace_task_list(task_list_id, title, self.viewing_user.id, users)

    def remove_list(self, task_list_id: int):
        self.persistence.remove_task_list(self.viewing_user.id, task_list_id)

    def date_from_timestamp(self, timestamp):
        if timestamp is None:
            return None
        return datetime.fromtimestamp(timestamp / 1000.0)

    def create_or_update_task(self, task_list_id: int, task_id: int, json_request):
        prev_task = json_request.get("prev")
        next_task = json_request["next"]

        requesting_user_id = self.viewing_user.id
        next_prerequisites = next_task["prerequisites"]
        next_depending_tasks = next_task["dependingTasks"]
        next_tags = next_task["tags"]
        if prev_task is None:
            self.persistence.create_task(
                requesting_user_id,
                task_id,
                task_list_id,
                next_task["title"],
                self.date_from_timestamp(next_task["due"]),
                next_task["description"],
                next_task["completed"],
                prereq_task_ids=tuple(next_prerequisites),
                depending_task_ids=tuple(next_depending_tasks),
                tags=tuple(next_tags)
            )
        else:
            self.persistence.update_task(
                task_id,
                prev_task["title"],
                self.date_from_timestamp(prev_task["due"]),
                prev_task["description"],
                prev_task["completed"],
                next_task["title"],
                self.date_from_timestamp(next_task["due"]),
                next_task["description"],
                next_task["completed"],
                requesting_user_id
            )

            prev_tags = prev_task["tags"]
            for add_tag_candidate in next_tags:
                if add_tag_candidate not in prev_tags:
                    self.persistence.add_tag(requesting_user_id, task_id, add_tag_candidate)
            for remove_tag_candidate in prev_tags:
                if remove_tag_candidate not in next_tags:
                    self.persistence.remove_tag(requesting_user_id, task_id, remove_tag_candidate)

            prev_prerequisites = prev_task["prerequisites"]
            for add_prereq_candidate in next_prerequisites:
                if add_prereq_candidate not in prev_prerequisites:
                    self.persistence.add_dependency(requesting_user_id, add_prereq_candidate, task_id)
            for remove_tag_candidate in prev_prerequisites:
                if remove_tag_candidate not in next_prerequisites:
                    self.persistence.remove_dependency(requesting_user_id, remove_tag_candidate, task_id)

            prev_dependencies = prev_task["dependingTasks"]
            for add_dep_candidate in next_depending_tasks:
                if add_dep_candidate not in prev_dependencies:
                    self.persistence.add_dependency(requesting_user_id, task_id, add_dep_candidate)
            for remove_dep_candidate in prev_dependencies:
                if remove_dep_candidate not in next_depending_tasks:
                    self.persistence.remove_dependency(requesting_user_id, task_id, remove_dep_candidate)

    def remove_task(self, task_id: int):
        self.persistence.remove_task(self.viewing_user.id, task_id)


def nullable_date_to_timestamp(nullable_date):
    if nullable_date is None:
        return None
    else:
        return nullable_date.timestamp() * 1000
