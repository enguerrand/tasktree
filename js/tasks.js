class TaskEditView extends React.Component {
    // props.task
    // props.editingDone(taskAfterEdit, parentList)
    // props.parentList (only for edit, set to null for create)
    // props.createTaskId
    // props.allLists
    constructor(props) {
        super(props);
        let header;
        let initialTitle;
        if (isNull(this.props.task)) {
            header = "Create task";
            initialTitle = "";
        } else {
            header = "Edit task";
            initialTitle = this.props.task.title;
        }
        let parentListId = null;
        if (!isNull(this.props.parentList)) {
            parentListId = this.props.parentList.id;
        }
        this.state = {
            header: header,
            title: initialTitle,
            parentListId: parentListId,
            listDropDownVisible: false
        }
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleParentListChange = this.handleParentListChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleTitleChange(event) {
        this.setState({title: event.target.value});
    }

    handleParentListChange(event) {
        this.setState({parentListId: event.target.value});
    }

    async handleSubmit(event) {
        event.preventDefault();
        const title = this.state.title;
        const taskAfterEdit = {
            title: title,
            synced: false
        }
        if (isNull(this.props.task)) {
            taskAfterEdit.id = this.props.createTaskId();
        } else {
            taskAfterEdit.id = this.props.task.id;
            if (!isNull(this.props.task.id)) {
                taskAfterEdit.id = this.props.task.id;
            }
        }

        const parentList = this.props.allLists[this.state.parentListId];
        if (!isNull(parentList)) {
            // noinspection UnnecessaryLocalVariableJS
            const success = await sendTask(taskAfterEdit, parentList, this.props.task);
            taskAfterEdit.synced = success;
            this.props.editingDone(taskAfterEdit, parentList);
        }
    }

    render() {
        const formInputs = [];
        let currentlySelectedList = this.props.allLists[this.state.parentListId];
        formInputs.push(
            div({className:"form-floating", key: "titleInput"},
                input({type: "text", className: "form-control", id: "title-input", placeholder: "Title", value: this.state.title, onChange: this.handleTitleChange})
            )
        );

        if (isNull(this.props.parentList)) {
            let classDropdown = "dropdown";
            let classDropdownMenu = "dropdown-menu";
            let expanded = this.state.listDropDownVisible;
            if (this.state.listDropDownVisible) {
                classDropdown = classDropdown + " show";
                classDropdownMenu = classDropdownMenu + " show";
            }
            let buttonTitle;
            if (isNull(currentlySelectedList)) {
                buttonTitle = "Choose a List ...";
            } else {
                buttonTitle = currentlySelectedList.title;
            }
            const choices = [];
            for (const [listId, taskList] of Object.entries(this.props.allLists)) {
                choices.push(
                    a(
                        {
                            className: "dropdown-item",
                            key: listId,
                            onClick: () => this.setState({
                                parentListId: listId,
                                listDropDownVisible: false
                            })
                        },
                        taskList.title
                    )
                );
            }
            formInputs.push(
                div({className: classDropdown, key: "listChoice"},
                    button({
                        key: "button",
                        type: "button",
                        className: "btn btn-secondary dropdown-toggle",
                        "data-toggle":"dropdown",
                        "aria-haspopup": true,
                        "aria-expanded": expanded,
                        id: "list-input",
                        value: this.state.parentListId,
                        onClick: e => {
                            this.setState(prevState => {
                                return {
                                    listDropDownVisible: !prevState.listDropDownVisible
                                }
                            })
                        },
                        onChange: this.handleParentListChange
                    }, buttonTitle),
                    div({className: classDropdownMenu, "aria-labelledby": "list-input"},
                        choices
                    )
                )
            );
        }
        formInputs.push(
            button({className: "w-100 btn btn-lg btn-primary", type: "submit", key: "submit", disabled: isNull(currentlySelectedList)},
                "Save"
            )
        );

        return div(
            {className: "row"},
            div({className: "col-12"},
                form(
                    { onSubmit: this.handleSubmit },
                    h2({className: "h3 mb-3 fw-normal text-light"},
                        this.state.header
                    ),
                    formInputs
                )
            )
        );
    }
}

class TasksView extends React.Component {
    // props.taskLists
    // props.createTaskId
    // props.onTaskUpdatedLocally(task, taskList)
    constructor(props) {
        super(props);
        this.state = {
            editingTask: null,
            editingList: null
        }
        this.renderTasksTable = this.renderTasksTable.bind(this);
        this.addTask = this.addTask.bind(this);
        this.editTask = this.editTask.bind(this);
    }

    addTask(event, taskLists) {
        event.preventDefault();
        this.setState({
            editingTask: null,
            editingList: null,
            createNew: true,
        });
    }

    editTask(event, task, taskList) {
        event.preventDefault();
        this.setState({
            editingTask: task,
            editingList: taskList,
            createNew: false,
        });
    }

    renderTasksTable() {
        let rows = [];
        for (const [taskListId, taskList] of Object.entries(this.props.taskLists)) {
            let tasks = taskList.tasks;
            for (const [taskId, task] of Object.entries(tasks)) {
                rows.push(
                    tr({key: taskId},
                        th({key: "id", scope: "row", className: "align-middle"}, taskId),
                        td({key: "title", className: "align-middle"}, task.title),
                        td(
                            {key: "action", className: "right align-middle"},
                            button({className: "btn btn-primary", onClick: (event) => this.editTask(event, task, taskList)}, i({className: "mdi mdi-pencil-outline"}))
                        )
                    )
                );
            }
        }
        const tasksTable = table({className: "table table-striped table-dark", key: "table"},
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
                tasksTable,
                button({
                    key: "addButton",
                    className: "btn btn-primary",
                    onClick:  event => this.addTask(event, this.props.taskLists)
                }, "+")
            )
        );
    }

    render() {
        if (this.state.createNew || !isNull(this.state.editingTask)) {
            return e(
                TaskEditView,
                {
                    task: this.state.editingTask,
                    parentList: this.state.editingList,
                    editingDone: async (taskAfterEdit, parentList) => {
                        await this.props.onTaskUpdatedLocally(taskAfterEdit, parentList);
                        this.setState({ editingTask: null, editingList: null, createNew: false });
                    },
                    createTaskId: this.props.createTaskId,
                    allLists: this.props.taskLists
                }
            );
        } else {
            return this.renderTasksTable();
        }
    }
}