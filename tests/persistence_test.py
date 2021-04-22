from unittest import TestCase

import persistence

USER_A_NAME = "Luke"
USER_A_PSWD = "aiv2Iihe8&ie6oözahx2Lig"
USER_B_NAME = "Leia"
USER_B_PSWD = "aiv2Iihe8&ie6oözahx2Lih"


class TestPersistence(TestCase):

    def setUp(self):
        self.persistence = persistence.Persistence(persistence.DB_URL_DEV)
        self.persistence.create()
        self.persistence.create_user(USER_A_NAME, USER_A_PSWD)
        self.persistence.create_user(USER_B_NAME, USER_B_PSWD)

    def test_get_user(self):
        user = self.persistence.get_user(USER_A_NAME)
        self.assertEqual(USER_A_NAME, user.username)
        self.assertEqual(USER_A_PSWD, user.password)

    def test_get_users(self):
        users = self.persistence.get_users()
        self.assertEqual(USER_A_NAME, users[0].username)
        self.assertEqual(USER_A_PSWD, users[0].password)
        self.assertEqual(USER_B_NAME, users[1].username)
        self.assertEqual(USER_B_PSWD, users[1].password)
