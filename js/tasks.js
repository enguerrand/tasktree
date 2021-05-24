class ConflictButtonsArea extends React.Component {
    // props.toggle
    // props.pull
    // props.push
    // props.remoteValueAvailable
    // props.remoteValueShown
    constructor(props) {
        super(props);
    }

    render() {
        const conflictButtons = [];
        const titleToggle = this.props.remoteValueShown ? "Hide remote version" : "Show remote version";
        if (this.props.remoteValueAvailable) {
            let toggleRemoteTitleButton = "mdi mdi-swap-horizontal-circle";
            if (this.props.remoteValueShown) {
                toggleRemoteTitleButton += " mdi-flip-h";
                conflictButtons.push(
                    div({key: "pull-button", className: "conflict-button text-success", onClick: this.props.pull, title: "pull remote version (overwrite my own changes)"},
                        i({
                            className: "mdi mdi-arrow-down-circle"
                        })
                    )
                );
                conflictButtons.push(
                    div({key: "push-button", className: "conflict-button text-primary", onClick: this.props.push, title: "push local version (overwrite remote changes)"},
                        i({
                            className: "mdi mdi-arrow-up-circle"
                        })
                    )
                );
            }
            conflictButtons.push(
                div({key: "toggle-button", className: "conflict-button text-danger", onClick: this.props.toggle, title: titleToggle},
                    i({
                        className: toggleRemoteTitleButton
                    })
                )
            );
        }
        return div({key: "conflict-buttons", className: "conflict-button-area"},
            conflictButtons
        );
    }
}

class TaskEditView extends React.Component {
    // props.task
    // props.editingDone(taskAfterEdit, parentList)
    // props.onCancel
    // props.parentList (only for edit, set to null for create)
    // props.createTaskId
    // props.allLists
    constructor(props) {
        super(props);
        let header;
        let initialTitle;
        let remoteTitle;
        let initialDescription;
        let remoteDescription;
        let initialDue;
        let initialTags;
        if (isNull(this.props.task)) {
            header = "Create task";
            initialTitle = "";
            initialDescription = "";
            initialDue = null;
            initialTags = [];
        } else {
            header = "Edit task";
            initialTitle = this.props.task.title;
            initialDescription = this.props.task.description;
            remoteTitle = this.props.task.conflicting_title;
            remoteDescription = this.props.task.conflicting_description;
            initialDue = this.props.task.due;
            initialTags = this.props.task.tags;
        }
        let parentListId = null;
        if (!isNull(this.props.parentList)) {
            parentListId = this.props.parentList.id;
        }
        this.state = {
            header: header,
            previousTitle: initialTitle,
            title: initialTitle,
            remoteTitle: remoteTitle,
            showRemoteTitle: false,
            previousDescription: initialDescription,
            description: initialDescription,
            remoteDescription: remoteDescription,
            showRemoteDescription: false,
            due: initialDue,
            tags: initialTags,
            parentListId: parentListId,
            listDropDownVisible: false,
        }
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.pullRemoteTitle = this.pullRemoteTitle.bind(this);
        this.pushLocalTitle = this.pushLocalTitle.bind(this);
        this.toggleShowRemoteTitle = this.toggleShowRemoteTitle.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleParentListChange = this.handleParentListChange.bind(this);
        this.pullRemoteDescription = this.pullRemoteDescription.bind(this);
        this.pushLocalDescription = this.pushLocalDescription.bind(this);
        this.toggleShowRemoteDescription = this.toggleShowRemoteDescription.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleTitleChange(event) {
        this.setState({title: event.target.value});
    }

    handleDescriptionChange(event) {
        this.setState({description: event.target.value});
    }

    handleParentListChange(event) {
        this.setState({parentListId: event.target.value});
    }

    toggleShowRemoteTitle() {
        this.setState(prevState => {
            return {
                showRemoteTitle: !prevState.showRemoteTitle
            }
        });
    }

    pullRemoteTitle() {
        this.setState(prevState => {
            return {
                showRemoteTitle: false,
                previousTitle: prevState.remoteTitle,
                title: prevState.remoteTitle,
                remoteTitle: null
            };
        });
    }

    pushLocalTitle() {
        this.setState(prevState => {
            return {
                showRemoteTitle: false,
                previousTitle: prevState.remoteTitle,
                remoteTitle: null
            };
        });
    }

    pullRemoteDescription() {
        this.setState(prevState => {
            return {
                showRemoteDescription: false,
                previousDescription: prevState.remoteDescription,
                description: prevState.remoteDescription,
                remoteDescription: null
            };
        });
    }

    pushLocalDescription() {
        this.setState(prevState => {
            return {
                showRemoteDescription: false,
                previousDescription: prevState.remoteDescription,
                remoteDescription: null
            };
        });
    }


    toggleShowRemoteDescription() {
        this.setState(prevState => {
            return {
                showRemoteDescription: !prevState.showRemoteDescription
            }
        });
    }

    async handleSubmit(event) {
        event.preventDefault();
        const prevTask = deepCopy(this.props.task);
        prevTask.title = this.state.previousTitle;
        prevTask.description = this.state.previousDescription;
        const taskAfterEdit = {
            title: this.state.title,
            description: this.state.description,
            due: this.state.due,
            tags: this.state.tags,
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
            const success = await sendTask(taskAfterEdit, parentList, prevTask);
            taskAfterEdit.synced = success;
            this.props.editingDone(taskAfterEdit, parentList);
        }
    }

    render() {
        const formGroups = [];
        let currentlySelectedList = this.props.allLists[this.state.parentListId];
        formGroups.push(
            div({className:"form-group row", key: "titleInput"},
                label({key: "label", htmlFor: "title-input", className: "col-6 col-form-label text-light"}, "Title"),
                div({
                    key: "conflict-buttons",
                    className: "col-6"
                },
                    e(
                        ConflictButtonsArea,
                        {
                            toggle: this.toggleShowRemoteTitle,
                            pull: this.pullRemoteTitle,
                            push: this.pushLocalTitle,
                            remoteValueAvailable: !isNull(this.state.remoteTitle),
                            remoteValueShown: this.state.showRemoteTitle
                        }
                    )
                ),
                div({key: "input", className: "col-12"},
                    input({
                        id: "title-input",
                        key: "title-input",
                        type: "text",
                        className: "form-control",
                        placeholder: "Title",
                        value: this.state.showRemoteTitle ? this.state.remoteTitle : this.state.title,
                        onChange: this.handleTitleChange,
                        disabled: this.state.showRemoteTitle
                    })
                )
            )
        );

        if (isNull(this.props.parentList)) {
            let classDropdown = "col-12 dropdown ";
            let classDropdownMenu = "dropdown-menu";
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
            formGroups.push(
                div({className:"form-group row", key: "listChoice"},
                    label({key: "label", htmlFor: "list-input", className: "col-12 col-form-label text-light"}, "Task List"),
                    div({className: classDropdown, key: "input"},
                        button({
                            key: "button",
                            type: "button",
                            className: "btn btn-secondary dropdown-toggle",
                            id: "list-input",
                            value: this.state.parentListId,
                            onClick: () => {
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
                )
            );
        }

        formGroups.push(
            div({className:"form-group row", key: "descriptionInput"},
                label({key: "label", htmlFor: "description-input", className: "col-6 col-form-label text-light"}, "Description"),
                div({
                        key: "conflict-buttons",
                        className: "col-6"
                    },
                    e(
                        ConflictButtonsArea,
                        {
                            toggle: this.toggleShowRemoteDescription,
                            pull: this.pullRemoteDescription,
                            push: this.pushLocalDescription,
                            remoteValueAvailable: !isNull(this.state.remoteDescription),
                            remoteValueShown: this.state.showRemoteDescription
                        }
                    )
                ),
                div({key: "input", className: "col-12"},
                    e(
                        'textarea',
                        {
                            id: "description-input",
                            key: "input",
                            className: "form-control",
                            rows: "10",
                            value: this.state.showRemoteDescription ? this.state.remoteDescription : this.state.description,
                            onChange: this.handleDescriptionChange,
                            disabled: this.state.showRemoteDescription,
                        }
                    )
                )
            )
        );

        const saveDisabled = isNull(currentlySelectedList) || this.state.showRemoteTitle || this.state.showRemoteDescription;
        formGroups.push(
            div({className:"form-group row", key: "submit"},
                div({className: "col-6", key: "cancel"},
                    button({className: "w-100 btn btn-lg btn-secondary", type: "cancel", onClick: this.props.onCancel, key: "cancel"},
                        "Cancel"
                    )
                ),
                div({className: "col-6", key: "save"},
                    button({className: "w-100 btn btn-lg btn-primary", type: "submit", key: "submit", disabled: saveDisabled },
                        "Save"
                    )
                )
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
                    formGroups
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
                    // TODO add conflict hints
                    tr({key: taskId},
                        th({key: "id", scope: "row", className: "align-middle"}, taskId),
                        td(
                            {
                                key: "title",
                                className: "align-middle"
                            }, task.title
                        ),
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
                    onCancel: () => {
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