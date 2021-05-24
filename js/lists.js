
class ListEditView extends React.Component {
    // props.taskList
    // props.editingDone(listAfterEdit)
    // props.onCancel
    // props.createListId
    constructor(props) {
        super(props);
        let header;
        let initialTitle;
        if (isNull(this.props.taskList)) {
            header = "Create list";
            initialTitle = "";
        } else {
            header = "Edit list";
            initialTitle = this.props.taskList.title;
        }
        this.state = {
            header: header,
            title: initialTitle
        }
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleTitleChange(event) {
        this.setState({title: event.target.value});
    }

    async handleSubmit(event) {
        event.preventDefault();
        const title = this.state.title;
        const listAfterEdit = {
            title: title,
            synced: false
        }
        if (isNull(this.props.taskList)) {
            listAfterEdit.id = this.props.createListId();
            listAfterEdit.tasks = {};
        } else {
            listAfterEdit.id = this.props.taskList.id;
            listAfterEdit.tasks = this.props.taskList.tasks;
        }

        const success = await sendTaskList(listAfterEdit);
        listAfterEdit.synced = success;
        this.props.editingDone(listAfterEdit);
    }

    render() {
        return [
            div(
                {className: "row", key: "form"},
                div({className: "col-12 space-below"},
                    form(
                        null,
                        h2({className: "h3 mb-3 fw-normal text-light"},
                            this.state.header
                        ),
                        div({className:"form-floating"},
                            input({type: "text", className: "form-control", id: "title-input", placeholder: "Title", value: this.state.title, onChange: this.handleTitleChange}),
                            label({htmlFor: "title-input", className: "text-light"}, "Title")
                        ),
                        button({className: "w-100 btn btn-lg btn-primary", type: "submit"},
                            "Save"
                        )
                    )
                )
            ),
            div({className:"row floating-form-buttons bg-dark", key: "submit"},
                div({className: "col-6", key: "cancel"},
                    button({className: "w-100 btn btn-lg btn-secondary", type: "cancel", onClick: this.props.onCancel, key: "cancel"},
                        "Cancel"
                    )
                ),
                div({className: "col-6", key: "save"},
                    button({className: "w-100 btn btn-lg btn-primary", type: "submit", key: "submit", onClick: this.handleSubmit },
                        "Save"
                    )
                )
            )
        ];
    }
}

class ListsView extends React.Component {
    // prop.taskLists
    // prop.onListUpdatedLocally(taskList)
    // props.createListId
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
            rows.push(
                tr({key: taskListId},
                    th({key: "id", scope: "row", className: "align-middle"}, taskListId),
                    td({key: "title", className: "align-middle"}, taskList.title),
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
                    th({key: "id", scope: "col", className: "align-middle"}, "ID"),
                    th({key: "title", scope: "col", className: "align-middle"}, "TITLE"),
                    th({key: "action", scope: "col", className: "right align-middle"}, "ACTION")
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
                    createListId: this.props.createListId
                }
            );
        } else {
            return this.renderListsTable();
        }
    }
}
