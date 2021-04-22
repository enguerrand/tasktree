from persistence import Persistence, User


class UserView:
    def __init__(self, user: User):
        self.id = user.id
        self.username = user.username


class DataView:
    def __init__(self, persistence: Persistence, viewing_user: User):
        self.persistence = persistence
        self.viewing_user = viewing_user

    def get_users(self):
        return [UserView(user) for user in self.persistence.get_users()]

