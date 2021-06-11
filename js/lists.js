
class ListEditView extends React.Component {
    // props.taskList
    // props.editingDone(listAfterEdit)
    // props.onCancel
    // props.createListId
    // props.deleteList(listId)
    constructor(props) {
        super(props);
        let listId;
        let header;
        let initialTitle;
        if (isNull(this.props.taskList)) {
            listId = this.props.createListId(),
            header = S["lists.form.title.create"];
            initialTitle = "";
        } else {
            listId = this.props.taskList.id;
            header = S["lists.form.title.edit"];
            initialTitle = this.props.taskList.title;
        }
        this.state = {
            listId: listId,
            header: header,
            title: initialTitle,
            currentModalProps: null,
        }
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleDeletion = this.handleDeletion.bind(this);
    }

    handleTitleChange(event) {
        this.setState({title: event.target.value});
    }

    async handleSubmit(event) {
        event.preventDefault();
        const listAfterEdit = {
            id: this.state.listId,
            title: this.state.title,
            synced: false
        }
        if (isNull(this.props.taskList)) {
            listAfterEdit.tasks = {};
        } else {
            listAfterEdit.tasks = this.props.taskList.tasks;
        }

        const success = await sendTaskList(listAfterEdit);
        listAfterEdit.synced = success;
        this.props.editingDone(listAfterEdit);
    }

    handleDeletion() {
        const listId = this.props.taskList?.id;
        if (!isNull(listId)) {
            const doDelete = async () => {
                const success = await this.props.deleteList(listId);
                if (success) {
                    this.setState({
                        currentModalProps: null,
                    }, this.props.onCancel);
                } else {
                    this.setState({
                        currentModalProps: {
                            title: S["delete.list.title"],
                            message: S["delete.list.failed.message"],
                            saveButtonLabel: S["label.delete"],
                            onSubmit: doDelete,
                        }
                    });
                }
            }

            this.setState({
                currentModalProps: {
                    title: S["delete.list.title"],
                    message: S["delete.list.message"],
                    saveButtonLabel: S["label.delete"],
                    onSubmit: doDelete
                }
            });
        }
    }

    render() {
        const formGroups = [];

        formGroups.push(
            div({className:"form-group row", key: "titleInput"},
                label({key: "label", htmlFor: "title-input", className: "col-6 col-form-label text-light"}, S["label.title"]),
                div({key: "input", className: "col-12"},
                    div({className: "clearable-input-wrapper"},
                        input({
                            id: "title-input",
                            key: "title-input",
                            type: "text",
                            className: "form-control",
                            placeholder: S["label.title"],
                            autoComplete: "off",
                            value: this.state.title,
                            onChange: this.handleTitleChange,
                        }),
                        e(
                            InputClearButton,
                            {
                                key: "clear-button",
                                onClick: () => this.setState({title: ""})
                            }
                        )
                    )
                )
            )
        );

        if (!isNull(this.props.taskList)) {
            formGroups.push(
                div({className:"form-group row", key: "delete-action"},
                    label({key: "label", className: "col-12 col-form-label text-light"}, S["danger.zone"]),
                    div({key: "delete-button", className: "col-12 col-form-button"},
                        button({className: "btn btn-danger col-2 col-md-1 ml-1 mr-1", type: "button", onClick: this.handleDeletion}, S["tasks.form.delete"])
                    )
                )
            );
        }

        let currentModal;
        if (isNull(this.state.currentModalProps)) {
            currentModal = null;
        } else {
            currentModal = e(
                    ModalDialog,
                    {
                        key: "modal",
                        title: this.state.currentModalProps.title,
                        saveButtonLabel: this.state.currentModalProps.saveButtonLabel,
                        onCancel: () => this.setState({
                            currentModalProps: null,
                        }),
                        onSubmit: this.state.currentModalProps.onSubmit
                    },
                    div({},
                        p({}, this.state.currentModalProps.message)
                    )
            );
        }
        return [
            div(
                {className: "row", key: "form"},
                div({className: "col-12 space-below"},
                    form(
                        null,
                        h2({className: "h3 mb-3 fw-normal text-light"},
                            this.state.header
                        ),
                        formGroups
                    )
                )
            ),
            div({className:"row floating-form-buttons bg-dark", key: "submit"},
                div({className: "col-6", key: "cancel"},
                    button({className: "w-100 btn btn-lg btn-secondary", type: "cancel", onClick: this.props.onCancel, key: "cancel"},
                        S["label.cancel"]
                    )
                ),
                div({className: "col-6", key: "save"},
                    button({className: "w-100 btn btn-lg btn-primary", type: "submit", key: "submit", onClick: this.handleSubmit },
                        S["label.save"]
                    )
                )
            ),
            currentModal
        ];
    }
}

class ListsView extends React.Component {
    // prop.taskLists
    // prop.activeListIds
    // prop.setListActive(id, active)
    // prop.onListUpdatedLocally(taskList)
    // props.createListId
    // props.deleteList(listId)
    constructor(props) {
        super(props);
        this.state = {
            editingList: null,
            createNew: false
        }
        this.editList = this.editList.bind(this);
        this.renderListsTable = this.renderListsTable.bind(this);
        this.addList = this.addList.bind(this);
        this.editList = this.editList.bind(this);
    }

    addList(event) {
        event.preventDefault();
        this.setState({
            createNew: true
        });
    }

    editList(event, taskList) {
        event.preventDefault();
        this.setState({
            editingList: taskList
        });
    }

    renderListsTable() {
        let rows = [];
        for (const [taskListId, taskList] of Object.entries(this.props.taskLists)) {
            const listActive = this.props.activeListIds.includes(taskListId);
            const activationToggle = button(
                {
                    className: "btn btn-secondary",
                    onClick: () => this.props.setListActive(taskListId, !listActive)
                },
                i({className: "mdi mdi-" + (listActive ? "check" : "checkbox-blank-outline")})
            );
            rows.push(
                tr({key: taskListId},
                    // th({key: "id", scope: "row", className: "align-middle"}, taskListId),
                    td({key: "active", className: "align-middle"}, activationToggle),
                    td({key: "title", className: "align-middle" + (listActive ? "" : " text-secondary")}, taskList.title),
                    td(
                        {key: "action", className: "right align-middle"},
                        button({className: "btn btn-primary", onClick: (event) => this.editList(event, taskList)}, i({className: "mdi mdi-pencil-outline"}))
                    )
                )
            );
        }
        const listsTable = table({className: "table table-striped table-dark", key: "table"},
            thead({key: "head"},
                tr(null,
                    // th({key: "id", scope: "col", className: "align-middle"}, "ID"),
                    th({key: "active", scope: "col", className: "align-middle"}, S["lists.table.header.active"]),
                    th({key: "title", scope: "col", className: "align-middle"}, S["lists.table.header.title"]),
                    th({key: "action", scope: "col", className: "right align-middle"}, S["lists.table.header.action"])
                )
            ),
            tbody({key: "body"}, rows)
        )
        return div({ className: "row" },
            div({ className: "col-12" },
                listsTable,
                button({
                    key: "addButton",
                    className: "btn btn-primary",
                    onClick:  this.addList
                }, "+")
            )
        );
    }

    render() {
        if (this.state.createNew || !isNull(this.state.editingList)) {
            let listToSet;
            if (this.state.createNew) {
                listToSet = null;
            } else {
                listToSet = this.state.editingList;
            }
            return e(
                ListEditView,
                {
                    taskList: listToSet,
                    editingDone: async (listAfterEdit) => {
                        await this.props.onListUpdatedLocally(listAfterEdit);
                        this.setState({ editingList: null, createNew: false });
                    },
                    onCancel: () => {
                        this.setState({ editingList: null, createNew: false });
                    },
                    createListId: this.props.createListId,
                    deleteList: this.props.deleteList
                }
            );
        } else {
            return this.renderListsTable();
        }
    }
}
