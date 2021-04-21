from persistence import DB_URL_DEV, Persistence


def main():
    persistence = Persistence(DB_URL_DEV)
    persistence.hello("held")


if __name__ == '__main__':
    main()
