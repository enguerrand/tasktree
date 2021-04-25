from unittest import TestCase
from sqlalchemy.exc import IntegrityError, NoResultFound

import persistence

TASK_ID_1 = 1

USER_A_NAME = "Luke"
USER_A_PSWD = "aiv2Iihe8&ie6oözahx2Lig"
USER_B_NAME = "Leia"
USER_B_PSWD = "aiv2Iihe8&ie6oözahx2Lih"
TASK_LIST_1_TITLE = "get it done"
TASK_LIST_2_TITLE = "let it wait"
TASK_LIST_3_TITLE = "shared stuff"
NON_EXISTANT_USER_ID = 42


class TestPersistence(TestCase):
    def setUp(self):
        self.persistence = persistence.Persistence(persistence.DB_URL_DEV)
        self.persistence.create()
        self.persistence.create_user(USER_A_NAME, USER_A_PSWD)
        self.persistence.create_user(USER_B_NAME, USER_B_PSWD)
        self.user_a = self.persistence.get_user_by_name(USER_A_NAME)
        self.user_b = self.persistence.get_user_by_name(USER_B_NAME)
        self.persistence.create_task_list(TASK_LIST_1_TITLE, self.user_a.id)
        self.persistence.create_task_list(TASK_LIST_2_TITLE, self.user_b.id)
        self.persistence.create_task_list(TASK_LIST_3_TITLE, self.user_b.id)
        self.persistence.share_task_list_with(3, self.user_a.id, self.user_b.id)
        self.persistence.create_task(1, 1, "task 1", description="desc task 1")

    def test_get_user(self):
        user = self.persistence.get_user(1)
        self.assertEqual(USER_A_NAME, user.username)

    def test_get_user_by_name(self):
        user = self.persistence.get_user_by_name(USER_A_NAME)
        self.assertEqual(USER_A_NAME, user.username)

    def test_get_users(self):
        self.assertEqual(USER_A_NAME, self.persistence.get_users()[0].username)
        self.assertEqual(USER_B_NAME, self.persistence.get_users()[1].username)

    def test_authentication_success(self):
        authenticated_user = self.persistence.get_authenticated_user_by_name(USER_A_NAME, USER_A_PSWD)
        self.assertEqual(USER_A_NAME, authenticated_user.username)

    def test_authentication_failed(self):
        authenticated_user = self.persistence.get_authenticated_user_by_name(USER_A_NAME, USER_B_PSWD)
        self.assertIsNone(authenticated_user)

    def test_authentication_unknown_user(self):
        authenticated_user = self.persistence.get_authenticated_user_by_name("anonymous", USER_B_PSWD)
        self.assertIsNone(authenticated_user)

    def test_no_duplicate_users(self):
        self.assertRaises(IntegrityError, lambda: self.persistence.create_user(USER_A_NAME, "whatever"))

    def test_no_insert_task_list_for_non_existant_user(self):
        self.assertRaises(NoResultFound, lambda: self.persistence.create_task_list("whatever", NON_EXISTANT_USER_ID))

    def test_get_task_list(self):
        self.assertEqual(TASK_LIST_1_TITLE, self.persistence.get_task_list(requesting_user_id=1, task_list_id=1).title)

    def test_get_task_list(self):
        self.assertRaises(NoResultFound, lambda: self.persistence.get_task_list(requesting_user_id=2, task_list_id=1))

    def test_get_task_lists_user_a(self):
        tl = self.persistence.get_task_lists(self.user_a.id)
        self.assertEqual(2, len(tl))
        self.assertEqual(TASK_LIST_1_TITLE, tl[0].title)
        self.assertEqual(TASK_LIST_3_TITLE, tl[1].title)

    def test_get_task_lists_user_b(self):
        tl = self.persistence.get_task_lists(self.user_b.id)
        self.assertEqual(2, len(tl))
        self.assertEqual(TASK_LIST_2_TITLE, tl[0].title)
        self.assertEqual(TASK_LIST_3_TITLE, tl[1].title)

    def test_change_task_list_title_success(self):
        next_title = "something"
        self.persistence.set_task_list_title(3, next_title, self.user_a.id)
        self.assertEqual(next_title, self.persistence.get_task_lists(self.user_b.id)[1].title)

    def test_change_task_list_title_no_permission(self):
        next_title = "something"
        self.assertRaises(
            NoResultFound,
            lambda: self.persistence.set_task_list_title(2, next_title, self.user_a.id),
        )
        self.assertEqual(TASK_LIST_2_TITLE, self.persistence.get_task_lists(self.user_b.id)[0].title)

    def test_get_task(self):
        self.assertEqual("task 1", self.persistence.get_task(TASK_ID_1, self.user_a.id).title)

    def test_get_task(self):
        self.assertRaises(NoResultFound, lambda: self.persistence.get_task(TASK_ID_1, self.user_b.id))
