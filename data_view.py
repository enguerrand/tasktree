import json
from typing import List

from flask_login import UserMixin

from persistence import Persistence, User


class UserView(UserMixin):
    def __init__(self, user: User):
        self.id = user.id
        self.username = user.username

    def as_dict(self):
        return {"id": self.id, "username": self.username}


class DataView:
    def __init__(self, persistence: Persistence, viewing_user: User):
        self.persistence = persistence
        self.viewing_user = viewing_user

    def get_user(self, user_id: int) -> UserView:
        return UserView(self.persistence.get_user(user_id)).as_dict()

    def get_users(self) -> List[UserView]:
        return [UserView(user).as_dict() for user in self.persistence.get_users()]
