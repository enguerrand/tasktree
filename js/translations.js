const TRANSL_EN_US = {
    "label.cancel": "Cancel",
    "label.save": "Save",
    "label.title": "Title",
    "lists.form.title.create": "Create list",
    "lists.form.title.edit": "Edit list",
    "lists.table.header.action": "ACTION",
    "lists.table.header.active": "ACTIVE",
    "lists.table.header.title": "TITLE",
    "tasks.form.description": "Description",
    "tasks.form.links": "Links",
    "tasks.form.list": "Task List",
    "tasks.form.list.hint": "Choose a list...",
    "tasks.form.tags": "Tags",
    "tasks.form.tags.hint": "Type to add tags...",
    "tasks.form.title.create": "Create Task",
    "tasks.form.title.edit": "Edit Task",
    "tasks.table.input.hint": "Search or create...",
    "tasks.table.header.action": "ACTION",
    "tasks.table.header.title": "TITLE",
    "nav.item.lists": "LISTS",
    "nav.item.tasks": "TASKS",
};
const TRANSL_DE_DE = {
    "label.cancel": "Abbrechen",
    "label.save": "Speichern",
    "label.title": "Titel",
    "lists.form.title.create": "Liste erstellen",
    "lists.form.title.edit": "Liste bearbeiten",
    "lists.table.header.action": "AKTION",
    "lists.table.header.active": "AKTIV",
    "lists.table.header.title": "TITEL",
    "tasks.form.description": "Beschreibung",
    "tasks.form.links": "Links",
    "tasks.form.list": "Liste",
    "tasks.form.list.hint": "Wähle eine Liste...",
    "tasks.form.tags": "Tags",
    "tasks.form.tags.hint": "Tippe zum Erstellen...",
    "tasks.form.title.create": "Aufgabe erstellen",
    "tasks.form.title.edit": "Aufgabe bearbeiten",
    "tasks.table.input.hint": "Suche oder erstelle...",
    "tasks.table.header.action": "AKTION",
    "tasks.table.header.title": "TITEL",
    "nav.item.lists": "LISTEN",
    "nav.item.tasks": "AUFGABEN",
};
const TRANSLATIONS = {
    "en-US": TRANSL_EN_US,
    "de-DE": TRANSL_DE_DE
}

const S = TRANSLATIONS[navigator.language] || TRANSL_EN_US;