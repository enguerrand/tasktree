from unittest import TestCase

import persistence

USER_A_NAME = "Luke"
USER_A_PSWD = "aiv2Iihe8&ie6oözahx2Lig"


class TestPersistence(TestCase):

    def setUp(self):
        self.persistence = persistence.Persistence(persistence.DB_URL_DEV)
        self.persistence.create()
        self.persistence.create_user(USER_A_NAME, USER_A_PSWD)

    def test_get_users(self):
        user = self.persistence.get_user(USER_A_NAME)
        self.assertEqual(USER_A_PSWD, user.password)
