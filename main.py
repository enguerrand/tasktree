from data_view import DataView
from persistence import DB_URL_DEV, DB_URL_PROD, Persistence


def main():
    persistence = Persistence(DB_URL_PROD)
    me = persistence.get_user("edr")
    data_view = DataView(persistence, me)
    for u in data_view.get_users():
        print(u.username)


if __name__ == '__main__':
    main()
