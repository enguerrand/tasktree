
class ListEditView extends React.Component {
    // props.taskList
    // props.editingDone(listAfterEdit)
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

    handleSubmit(event) {
        event.preventDefault();
        const title = this.state.title;
        const listAfterEdit = {
            title: title
        }
        if (!isNull(this.props.taskList)) {
            listAfterEdit.id = this.props.taskList.id
        }
        postTaskList(listAfterEdit).then(success => {
            listAfterEdit.synced = success;
            this.props.editingDone(listAfterEdit);
        });
    }

    render() {
        return div(
            {className: "row"},
            div({className: "col-12"},
                form(
                    { onSubmit: this.handleSubmit },
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
        );
    }
}

class ListsView extends React.Component {
    // prop.lists
    // prop.onListAddedLocally(taskList)
    // prop.onListUpdatedLocally(taskList)
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
        for (let listIndex = 0; listIndex < this.props.lists.length; listIndex++) {
            const taskList = this.props.lists[listIndex];
            const listId = taskList.id;
            let key = listId;
            if (isNull(key)) {
                key = Math.random().toString(36).substring(10);
            }
            rows.push(
                tr({key: key},
                    th({key: "id", scope: "row", className: "align-middle"}, listId),
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
        if (this.state.createNew) {
            return e(
                ListEditView,
                {
                    taskList: null,
                    editingDone: (listAfterEdit) => {
                        this.props.onListAddedLocally(listAfterEdit);
                        this.setState({ createNew: false });
                    }
                }
            );
        } else if (!isNull(this.state.editingList)) {
            return e(
                ListEditView,
                {
                    taskList: this.state.editingList,
                    editingDone: (listAfterEdit) => {
                        this.props.onListUpdatedLocally(listAfterEdit);
                        this.setState({ editingList: null });
                    }
                }
            );
        } else {
            return this.renderListsTable();
        }
    }
}
