import datetime
from unittest import TestCase

from sqlalchemy.exc import IntegrityError, NoResultFound

import persistence


TASK_ID_1 = 1
TASK_ID_2 = 2
TASK_1_TITLE = "task 1"
TASK_1_DESCRIPTION = "desc task 1"
TASK_2_TITLE = "task 2"
TASK_2_DESCRIPTION = "desc task 2"

USER_A_NAME = "Luke"
USER_A_PSWD = "aiv2Iihe8&ie6oözahx2Lig"
USER_B_NAME = "Leia"
USER_B_PSWD = "aiv2Iihe8&ie6oözahx2Lih"
TASK_LIST_1_TITLE = "get it done"
TASK_LIST_2_TITLE = "let it wait"
TASK_LIST_3_TITLE = "shared stuff"
TASK_1_TAG_1 = "first tag"
TASK_1_TAG_2 = "second tag"
TASK_DUE_AT_TEN = "due at 10"
NON_EXISTANT_USER_ID = 42

DATE_TIME_08 = datetime.datetime.fromtimestamp(8)
DATE_TIME_09 = datetime.datetime.fromtimestamp(9)
DATE_TIME_10 = datetime.datetime.fromtimestamp(10)
DATE_TIME_11 = datetime.datetime.fromtimestamp(11)
DATE_TIME_12 = datetime.datetime.fromtimestamp(12)


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
        self.persistence.create_task(
            1, 1, TASK_1_TITLE, description=TASK_1_DESCRIPTION, tags=(TASK_1_TAG_1, TASK_1_TAG_2)
        )
        self.persistence.create_task(1, 1, TASK_1_TITLE, description=TASK_1_DESCRIPTION)
        self.persistence.create_task(1, 1, TASK_DUE_AT_TEN, description="due at 10 desc", due=DATE_TIME_10)
        self.task_due_at_ten = self.persistence.query_tasks(1).filter(persistence.Task.title == TASK_DUE_AT_TEN).one()

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
        self.assertEqual("task 1", self.persistence.get_task(self.user_a.id, TASK_ID_1).title)

    def test_get_task_not_found(self):
        self.assertRaises(NoResultFound, lambda: self.persistence.get_task(self.user_b.id, TASK_ID_1))

    def test_update_task_success(self):
        new_title = "new title"
        new_description = "next desc"
        self.persistence.update_task(
            TASK_ID_1, TASK_1_TITLE, None, TASK_1_DESCRIPTION, new_title, None, new_description, self.user_a.id
        )
        updated = self.persistence.get_task(self.user_a.id, TASK_ID_1)
        self.assertEqual(new_title, updated.title)
        self.assertEqual(new_description, updated.description)
        self.assertIsNone(self.persistence.get_task_conflict(self.user_a.id, TASK_ID_1))

    def test_update_task_title_conflict(self):
        new_title = "new title"
        new_description = "next desc"
        self.persistence.update_task(
            TASK_ID_1, "out of sync", None, TASK_1_DESCRIPTION, new_title, None, new_description, self.user_a.id
        )
        updated = self.persistence.get_task(self.user_a.id, TASK_ID_1)
        self.assertEqual(TASK_1_TITLE, updated.title)
        self.assertEqual(new_description, updated.description)
        conflict = self.persistence.get_task_conflict(self.user_a.id, TASK_ID_1)
        self.assertEqual(new_title, conflict.title)
        self.assertEqual(None, conflict.description)

    def test_update_task_description_conflict(self):
        new_title = "new title"
        new_description = "next desc"
        self.persistence.update_task(
            TASK_ID_1, TASK_1_TITLE, None, "out of sync", new_title, None, new_description, self.user_a.id
        )
        updated = self.persistence.get_task(self.user_a.id, TASK_ID_1)
        self.assertEqual(new_title, updated.title)
        self.assertEqual(TASK_1_DESCRIPTION, updated.description)
        conflict = self.persistence.get_task_conflict(self.user_a.id, TASK_ID_1)
        self.assertEqual(None, conflict.title)
        self.assertEqual(new_description, conflict.description)

    def test_update_task_title_and_description_conflict(self):
        new_title = "new title"
        new_description = "next desc"
        self.persistence.update_task(
            TASK_ID_1, "out of sync", None, "out of sync", new_title, None, new_description, self.user_a.id
        )
        updated = self.persistence.get_task(self.user_a.id, TASK_ID_1)
        self.assertEqual(TASK_1_TITLE, updated.title)
        self.assertEqual(TASK_1_DESCRIPTION, updated.description)
        conflict = self.persistence.get_task_conflict(self.user_a.id, TASK_ID_1)
        self.assertEqual(new_title, conflict.title)
        self.assertEqual(new_description, conflict.description)

    def test_update_task_title_and_description_conflict(self):
        new_title = "new title"
        new_description = "next desc"
        self.persistence.update_task(
            TASK_ID_1, "out of sync", None, "out of sync", new_title, None, new_description, self.user_a.id
        )
        updated = self.persistence.get_task(self.user_a.id, TASK_ID_1)
        self.assertEqual(TASK_1_TITLE, updated.title)
        self.assertEqual(TASK_1_DESCRIPTION, updated.description)
        conflict = self.persistence.get_task_conflict(self.user_a.id, TASK_ID_1)
        self.assertEqual(new_title, conflict.title)
        self.assertEqual(new_description, conflict.description)

    def test_update_task_due_conflict_present_is_none(self):
        task1 = self.persistence.get_task(self.user_a.id, 1)
        self.date_conflicts(task=task1, prev=DATE_TIME_09, req=DATE_TIME_11, expect=DATE_TIME_11)

    def test_update_task_due_conflict_request_is_older(self):
        self.date_conflicts(task=self.task_due_at_ten, prev=DATE_TIME_09, req=DATE_TIME_08, expect=DATE_TIME_08)

    def test_update_task_due_conflict_present_is_older(self):
        self.date_conflicts(task=self.task_due_at_ten, prev=DATE_TIME_11, req=DATE_TIME_12, expect=DATE_TIME_10)

    def test_update_task_due_conflict_no_change_requested(self):
        self.date_conflicts(task=self.task_due_at_ten, prev=DATE_TIME_09, req=DATE_TIME_09, expect=DATE_TIME_10)

    def test_update_task_due_conflict_none_requested(self):
        self.date_conflicts(task=self.task_due_at_ten, prev=DATE_TIME_09, req=None, expect=DATE_TIME_10)

    def test_task_completion(self):
        self.assertIsNone(self.persistence.get_task(self.user_a.id, TASK_ID_1).due)
        self.persistence.complete_task(self.user_a.id, TASK_ID_1)
        self.assertIsNotNone(self.persistence.get_task(self.user_a.id, TASK_ID_1).due)

    def test_task_un_completion(self):
        self.persistence.complete_task(self.user_a.id, TASK_ID_1)
        self.assertIsNotNone(self.persistence.get_task(self.user_a.id, TASK_ID_1).due)
        self.persistence.un_complete_task(self.user_a.id, TASK_ID_1)
        self.assertIsNone(self.persistence.get_task(self.user_a.id, TASK_ID_1).due)

    def date_conflicts(self, task, prev, req, expect):
        new_title = task.title
        new_description = task.description
        self.persistence.update_task(
            task.id, task.title, prev, task.description, new_title, req, new_description, self.user_a.id
        )
        updated = self.persistence.get_task(self.user_a.id, task.id)
        self.assertEqual(expect, updated.due)
        self.assertEqual([], self.persistence.get_task_conflicts(self.user_a.id))

    def test_get_tags(self):
        tags = self.persistence.get_tags(self.user_a.id, TASK_ID_1)
        self.assertEqual([TASK_1_TAG_1, TASK_1_TAG_2], [t.title for t in tags])

    def test_add_tag(self):
        task1 = self.persistence.get_task(self.user_a.id, TASK_ID_1)
        task2 = self.persistence.get_task(self.user_a.id, TASK_ID_2)
        self.persistence.add_tag(self.user_a.id, TASK_ID_1, "whatever")
        self.persistence.add_tag(self.user_a.id, TASK_ID_2, "whatelse")
        self.assertTrue("whatever" in [t.title for t in task1.tags])
        self.assertTrue("whatelse" in [t.title for t in task2.tags])

    def test_delete_tag(self):
        task1 = self.persistence.get_task(self.user_a.id, TASK_ID_1)
        self.assertTrue(TASK_1_TAG_1 in [t.title for t in task1.tags])  # just to assert proper test setup
        self.persistence.remove_tag(self.user_a.id, task1.id, TASK_1_TAG_1)
        self.assertFalse(TASK_1_TAG_1 in [t.title for t in task1.tags])
        self.assertEqual(1, len(task1.tags))
        self.persistence.remove_tag(self.user_a.id, task1.id, TASK_1_TAG_2)
        self.assertEqual(0, len(task1.tags))
        self.assertIsNotNone(self.persistence.get_task(self.user_a.id, TASK_ID_1))

    def test_delete_fails_permission(self):
        task1 = self.persistence.get_task(self.user_a.id, TASK_ID_1)
        self.assertTrue(TASK_1_TAG_1 in [t.title for t in task1.tags])  # just to assert proper test setup
        self.assertRaises(NoResultFound, lambda: self.persistence.remove_tag(self.user_b.id, task1.id, TASK_1_TAG_1))
        self.assertTrue(TASK_1_TAG_1 in [t.title for t in task1.tags])

    def test_delete_task_list(self):
        task_list_id = 1
        self.persistence.remove_task_list(self.user_a.id, task_list_id)
        self.assertRaises(NoResultFound, lambda: self.persistence.get_task_list(self.user_a.id, task_list_id))
        self.assertRaises(NoResultFound, lambda: self.persistence.get_task(self.user_a.id, TASK_ID_1))
        task_1_tags = self.persistence.session.query(persistence.Tag).filter(persistence.Tag.task_id == TASK_ID_1).all()
        self.assertEqual(0, len(task_1_tags))
