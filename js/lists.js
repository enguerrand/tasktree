
class ListEditView extends React.Component {
    // props.taskList
    // props.editingDone(listAfterEdit)
    constructor(props) {
        super(props);
        let initialTitle;
        if (isNull(this.props.taskList)) {
            initialTitle = "";
        } else {
            initialTitle = this.props.taskList.title;
        }
        this.state = {
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
        let listId;
        if (isNull(this.props.taskList)) {
            listId = "";
            listAfterEdit.id = null;
        } else {
            listId = String(this.props.taskList.id);
            listAfterEdit.id = listId;
        }
        postJson(API_URL_LISTS + '/' + listId, {
            'title': title
        }).then(response => {
            if (response.ok) {
                console.log("ok");
                listAfterEdit.synced = true;
            } else {
                console.log("error");
                listAfterEdit.synced = false;
            }
            this.props.editingDone(listAfterEdit);
        }).catch((error) => {
            console.log(error);
            listAfterEdit.synced = false;
            this.props.editingDone(listAfterEdit);
        });
    }

    render() {
        return div(
            {className: "row"},
            div({className: "col-12"},
                form(
                    {onSubmit: this.handleSubmit},
                    h1({className: "h3 mb-3 fw-normal text-light"},
                        "Edit list"
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
    // prop.listAdded(taskList)
    // prop.listUpdated(taskList)
    constructor(props) {
        super(props);
        this.state = {
            editingList: null,
            createNew: false
        }
        this.editList = this.editList.bind(this);
        this.renderSelf = this.renderSelf.bind(this);
    }

    editList(taskList) {
        this.setState({
            editingList: taskList
        });
    }

    renderSelf() {
        let rows = [];
        for (const listId in this.props.lists) {
            const taskList = this.props.lists[listId];
            rows.push(
                tr({key: listId},
                    th({key: "id", scope: "row", className: "align-middle"}, listId),
                    td({key: "title", className: "align-middle"}, taskList.title),
                    td(
                        {key: "action", className: "right align-middle"},
                        button({className: "btn btn-primary", onClick: () => this.editList(taskList)}, i({className: "mdi mdi-pencil-outline"}))
                    )
                )
            );
        }
        return table({className: "table table-striped table-dark"},
            thead({key: "head"},
                tr(null,
                    th({key: "id", scope: "col", className: "align-middle"}, "ID"),
                    th({key: "title", scope: "col", className: "align-middle"}, "TITLE"),
                    th({key: "action", scope: "col", className: "right align-middle"}, "ACTION")
                )
            ),
            tbody({key: "body"}, rows)
        )
    }

    render() {
        if (this.state.createNew) {
            return e(
                ListEditView,
                {
                    taskList: null,
                    editingDone: (listAfterEdit) => {
                        this.props.listAdded(listAfterEdit);
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
                        this.props.listUpdated(listAfterEdit);
                        this.setState({ editingList: null });
                    }
                }
            );
        } else {
            return this.renderSelf();
        }
    }
}
