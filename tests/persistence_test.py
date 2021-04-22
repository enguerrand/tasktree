from unittest import TestCase

from sqlalchemy.exc import IntegrityError, NoResultFound

import persistence


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
        self.user_a = self.persistence.get_user(USER_A_NAME)
        self.user_b = self.persistence.get_user(USER_B_NAME)
        self.persistence.create_task_list(TASK_LIST_1_TITLE, self.user_a.id)
        self.persistence.create_task_list(TASK_LIST_2_TITLE, self.user_b.id)
        self.persistence.create_task_list(TASK_LIST_3_TITLE, self.user_b.id)
        self.persistence.share_task_list_with(3, self.user_a.id, self.user_b.id)

    def test_get_user(self):
        user = self.persistence.get_user(USER_A_NAME)
        self.assertEqual(USER_A_NAME, user.username)
        self.assertEqual(USER_A_PSWD, user.password)

    def test_get_users(self):
        self.assertEqual(USER_A_NAME, self.user_a.username)
        self.assertEqual(USER_A_PSWD, self.user_a.password)
        self.assertEqual(USER_B_NAME, self.user_b.username)
        self.assertEqual(USER_B_PSWD, self.user_b.password)

    def test_no_duplicate_users(self):
        self.assertRaises(IntegrityError, lambda: self.persistence.create_user(USER_A_NAME, "whatever"))

    def test_no_insert_task_list_for_non_existant_user(self):
        self.assertRaises(NoResultFound, lambda: self.persistence.create_task_list("whatever", NON_EXISTANT_USER_ID))

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
        self.persistence.change_task_list_title(3, TASK_LIST_3_TITLE, next_title, self.user_a.id)
        self.assertEqual(next_title, self.persistence.get_task_lists(self.user_b.id)[1].title)

    def test_change_task_list_title_conflict(self):
        next_title = "something"
        self.assertRaises(
            persistence.EditConflictException,
            lambda: self.persistence.change_task_list_title(3, "wrong previous title", next_title, self.user_a.id),
        )
        self.assertEqual(TASK_LIST_3_TITLE, self.persistence.get_task_lists(self.user_b.id)[1].title)

    def test_change_task_list_title_no_permission(self):
        next_title = "something"
        self.assertRaises(
            NoResultFound,
            lambda: self.persistence.change_task_list_title(2, TASK_LIST_2_TITLE, next_title, self.user_a.id),
        )
        self.assertEqual(TASK_LIST_2_TITLE, self.persistence.get_task_lists(self.user_b.id)[0].title)
