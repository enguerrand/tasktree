from typing import List


class CalendarEvent:
    def __init__(self, task):
        self.uid = task.id
        self.summary = escape_human_readable_text(task.title)
        self.description = escape_human_readable_text(task.description)
        self.dtstamp = format_date_time(task.created)
        self.dtstart = format_date_time(task.due)
        self.dtend = format_date_time(task.due)


class VCalendar:
    def __init__(self, prod_id: str, name: str, events: List[CalendarEvent]):
        self.name = escape_human_readable_text(name)
        self.events = events


def format_date_time(date_time):
    if date_time is None:
        return ""
    return date_time.strftime("%Y%m%dT%H%M%SZ")


def escape_human_readable_text(input: str):
    return input.replace('"', 'DQUOTE')\
        .replace(',', '\\,')\
        .replace(':', '":"')\
        .replace('\\', '\\\\')\
        .replace('\n', '\\n')

