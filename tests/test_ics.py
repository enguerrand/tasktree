from unittest import TestCase

from ics import escape_human_readable_text


class TestIcs(TestCase):
    def test_escape_user_content(self):
        self.assertEqual("foo", escape_human_readable_text("foo"))
        self.assertEqual(r"foo\nbar", escape_human_readable_text(r"foo\Nbar"))
        self.assertEqual(r"foo\\ \\nb", escape_human_readable_text(r"foo\ \nb"))
        self.assertEqual("foo\\\\\\n", escape_human_readable_text("foo\\\n"))
        self.assertEqual(r"\;", escape_human_readable_text(";"))
        self.assertEqual(r"\,", escape_human_readable_text(","))
