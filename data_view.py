import json
from typing import List

from persistence import Persistence, User


class UserView:
    def __init__(self, user: User, api_base_url: str):
        self.id = user.id
        self.username = user.username
        self.api_base_url = api_base_url

    def as_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "url": self.api_base_url + str(self.id)
        }


class DataView:
    def __init__(self, persistence: Persistence, viewing_user: User):
        self.persistence = persistence
        self.viewing_user = viewing_user

    def get_user(self, api_base_url: str, user_id: int) -> UserView:
        return UserView(self.persistence.get_user(user_id), api_base_url).as_dict()

    def get_users(self, api_base_url: str) -> List[UserView]:
        return [UserView(user, api_base_url).as_dict() for user in self.persistence.get_users()]
