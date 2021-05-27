class TagInput extends React.Component {
    // props.currentTags
    // props.allTags
    // props.addTag(tag)
    // props.removeTag(tag)
    constructor(props) {
        super(props);
        this.state = {
            currentInput: ""
        }
        this.handleTextInput = this.handleTextInput.bind(this);
        this.handleTextInputEnd = this.handleTextInputEnd.bind(this);
        this.interceptEnter = this.interceptEnter.bind(this);
        this.selectOption = this.selectOption.bind(this);
    }

    handleTextInput(event) {
        const cleaned = event.target.value.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, "");
        this.setState({
            currentInput: cleaned
        });
    }

    handleTextInputEnd(currentValue) {
        const cleaned = currentValue.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, "");
        this.setState({
            currentInput: ""
        }, () => this.props.addTag(cleaned));
    }

    interceptEnter(e) {
        if(e.nativeEvent.key === "Enter"){
            e.preventDefault();
            this.handleTextInputEnd(e.target.value);
        }
    }

    selectOption(option) {
        this.setState({
            currentInput: ""
        }, () => this.props.addTag(option));
    }

    render() {
        const inlineElements = [];
        for (const tag of this.props.currentTags) {
            inlineElements.push(
                div({className: "btn btn-primary btn-tag", key: tag, onClick: () => this.props.removeTag(tag)},
                    tag,
                    i({className: "mdi mdi-close-circle"})
                )
            )
        }
        inlineElements.push(
            input({
                id: "add-tag-input",
                key: "add-tag-input",
                type: "text",
                className: "add-tag-input",
                autoComplete: "off",
                placeholder: "type to add tags...",
                value: this.state.currentInput,
                onChange: this.handleTextInput,
                onKeyPress: this.interceptEnter
            })
        )

        const tagOptions = [];
        for (const opt of this.props.allTags) {
            if (this.props.currentTags.includes(opt)) {
                continue;
            }
            if (opt.includes(this.state.currentInput)) {
                tagOptions.push(
                    div({className: "btn btn-secondary btn-tag", key: opt, onClick: () => this.selectOption(opt)},
                        opt,
                        i({className: "mdi mdi-plus-circle"})
                    )
                )
            }
        }
        return (
            div({className: "col-12"},
                div({className: "tags-input-field form-control bg-light", key: "input"},
                    inlineElements
                ),
                div({className: "tags-available-field mt-2", key: "options"},
                    tagOptions
                )
            )
        );
    }
}

class CreateTaskInput extends React.Component {
    // props.openEditView(initialTitle)
    // props.trySmartSubmitUsingTitle(title)
    constructor(props) {
        super(props);
        this.state = {
            currentInput: ""
        }
        this.handleTextInput = this.handleTextInput.bind(this);
        this.interceptEnter = this.interceptEnter.bind(this);
    }

    handleTextInput(event) {
        this.setState({
            currentInput: event.target.value
        });
    }

    interceptEnter(e) {
        if(e.nativeEvent.key === "Enter"){
            e.preventDefault();
            const titleToUse = e.target.value;
            if (this.state.currentInput.length === 0) {
                return;
            }
            this.setState({
                currentInput: ""
            }, () => this.props.trySmartSubmitUsingTitle(titleToUse));
        }
    }

    render() {
        return div({className: "task-input-row"},
            input({
                key: "input",
                className: "form-control",
                type: "text",
                autoComplete: "off",
                placeholder: "type to add a new task...",
                value: this.state.currentInput,
                onChange: this.handleTextInput,
                onKeyPress: this.interceptEnter
            }),
            button({
                key: "addButton",
                className: "btn btn-primary",
                disabled: this.state.currentInput === 0,
                onClick:  (event) => {
                    event.preventDefault();
                    const usingTitle = this.state.currentInput;
                    this.setState({
                        currentInput: ""
                    }, () => this.props.openEditView(usingTitle));
                }
            }, i({className: "mdi mdi-plus"}))
        );
    }

}

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
    // props.requestedNewTitle
    // props.editingDone(taskAfterEdit, parentList)
    // props.onCancel
    // props.parentList (only for edit, set to null for create)
    // props.activeListIds
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
        let completed;
        if (isNull(this.props.task)) {
            header = "Create task";
            initialTitle = this.props.requestedNewTitle;
            initialDescription = "";
            initialDue = null;
            initialTags = [];
            completed = false;
        } else {
            header = "Edit task";
            initialTitle = this.props.task.title;
            initialDescription = this.props.task.description;
            remoteTitle = this.props.task.conflictingTitle;
            remoteDescription = this.props.task.conflictingDescription;
            initialDue = this.props.task.due;
            initialTags = this.props.task.tags;
            completed = this.props.task.completed;
        }
        let parentListId;
        if (!isNull(this.props.parentList)) {
            parentListId = this.props.parentList.id;
        } else if (Object.keys(props.allLists).length === 1) {
            parentListId = Object.keys(props.allLists)[0];
        } else {
            parentListId = null;
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
            completed: completed,
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
        this.addTag = this.addTag.bind(this);
        this.removeTag = this.removeTag.bind(this);
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

    addTag(tag) {
        this.setState(
            prevState => {
                const nextTags = Object.assign([], prevState.tags);
                if (!nextTags.includes(tag)) {
                    nextTags.push(tag);
                }
                return {
                    tags: nextTags
                }
            }
        );
    }

    removeTag(tag) {
        this.setState(
            prevState => {
                const nextTags = Object.assign([], prevState.tags);
                nextTags.removeIf(t => t === tag)
                return {
                    tags: nextTags
                }
            }
        );
    }

    async handleSubmit(event) {
        event.preventDefault();
        const prevTask = deepCopy(this.props.task);
        if (!isNull(prevTask)) {
            prevTask.title = this.state.previousTitle;
            prevTask.description = this.state.previousDescription;
        }
        const taskAfterEdit = {
            title: this.state.title,
            description: this.state.description,
            due: this.state.due,
            tags: this.state.tags,
            completed: this.state.completed,
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

        const allTags = [];
        const parentList = this.props.allLists[this.state.parentListId];
        if (!isNull(parentList) && this.props.activeListIds.includes(String(parentList.id))) {
            for (const [taskId, task] of Object.entries(parentList.tasks)) {
                for (const tag of task.tags) {
                    if (!allTags.includes(tag)) {
                        allTags.push(tag);
                    }
                }
            }
        }
        formGroups.push(
            div({className:"form-group row", key: "tags-input"},
                label({key: "label", htmlFor: "tags-input", className: "col-12 col-form-label text-light"}, "Tags"),
                e(
                    TagInput,
                    {
                        currentTags: this.state.tags,
                        allTags: allTags,
                        addTag: this.addTag,
                        removeTag: this.removeTag
                    }
                )
            )
        );

        const saveDisabled = isNull(currentlySelectedList) || this.state.showRemoteTitle || this.state.showRemoteDescription;

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
                        "Cancel"
                    )
                ),
                div({className: "col-6", key: "save"},
                    button({className: "w-100 btn btn-lg btn-primary", type: "submit", key: "submit", disabled: saveDisabled, onClick: this.handleSubmit },
                        "Save"
                    )
                )
            )
        ];
    }
}

class TasksView extends React.Component {
    // props.taskLists
    // props.activeListIds
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
        this.sendEditedTask = this.sendEditedTask.bind(this);
        this.trySmartSubmitUsingTitle = this.trySmartSubmitUsingTitle.bind(this);
    }

    addTask(taskLists, usingTitle) {
        this.setState({
            editingTask: null,
            editingList: null,
            createNewWithTitle: isNull(usingTitle) ? "" : usingTitle,
        });
    }

    editTask(event, task, taskList) {
        event.preventDefault();
        this.setState({
            editingTask: task,
            editingList: taskList,
            createNewWithTitle: null,
        });
    }

    async trySmartSubmitUsingTitle(title) {
        let parentList;
        if (Object.keys(this.props.taskLists).length === 1) {
            parentList = this.props.taskLists[Object.keys(this.props.taskLists)[0]];
        } else if (this.props.activeListIds.length === 1) {
            parentList = this.props.taskLists[this.props.activeListIds[0]];
        } else {
            parentList = null;
        }
        if (isNull(parentList)) {
            return this.addTask(this.props.taskLists, title);
        } else {
            return this.sendEditedTask({
                id: this.props.createTaskId(),
                title: title,
                description: "",
                due: null,
                tags: [],
                synced: false
            }, parentList);
        }
    }

    async sendEditedTask(taskAfterEdit, parentList) {
        await this.props.onTaskUpdatedLocally(taskAfterEdit, parentList);
        this.setState({editingTask: null, editingList: null, createNewWithTitle: null});
    }

    renderTasksTable() {
        let rows = [];
        rows.push(
            tr({key: "add-task"},
                td({colSpan: 2},
                    e(
                        CreateTaskInput,
                        {
                            trySmartSubmitUsingTitle: this.trySmartSubmitUsingTitle,
                            openEditView: (usingTitle) => {
                                return this.addTask(this.props.taskLists, usingTitle);
                            }
                        }
                    )
                ),
            )
        );
        for (const [taskListId, taskList] of Object.entries(this.props.taskLists)) {
            if (!this.props.activeListIds.includes(taskListId)) {
                continue;
            }
            let tasks = taskList.tasks;
            for (const [taskId, task] of Object.entries(tasks)) {
                const actionButtonColorType = hasConflicts(task) ? "danger" : "primary";
                rows.push(
                    tr({key: taskId},
                        // th({key: "id", scope: "row", className: "align-middle"}, taskId),
                        td(
                            {
                                key: "title",
                                className: "align-middle"
                            },
                            div({className: "tasks-table-cell-title", key: "title"}, task.title),
                            div({className: "tasks-table-cell-created text-secondary", key: "created"}, new Date(task.created).toLocaleString(LOCALE))
                        ),
                        td(
                            {key: "action", className: "right align-middle"},
                            button({className: "btn btn-" + actionButtonColorType, onClick: (event) => this.editTask(event, task, taskList)}, i({className: "mdi mdi-pencil-outline"}))
                        )
                    )
                );
            }
        }
        const tasksTable = table({className: "table table-striped table-dark", key: "table"},
            thead({key: "head"},
                tr(null,
                    // th({key: "id", scope: "col", className: "align-middle"}, "ID"),
                    th({key: "title", scope: "col", className: "align-middle"}, "TITLE"),
                    th({key: "action", scope: "col", className: "right align-middle"}, "ACTION")
                )
            ),
            tbody({key: "body"}, rows)
        )
        return div({ className: "row" },
            div({ className: "col-12" },
                tasksTable
            )
        );
    }

    render() {
        if (!isNull(this.state.createNewWithTitle) || !isNull(this.state.editingTask)) {
            return e(
                TaskEditView,
                {
                    task: this.state.editingTask,
                    requestedNewTitle: this.state.createNewWithTitle,
                    parentList: this.state.editingList,
                    editingDone: async (taskAfterEdit, parentList) => {
                        await this.sendEditedTask(taskAfterEdit, parentList);
                    },
                    onCancel: () => {
                        this.setState({ editingTask: null, editingList: null, createNewWithTitle: null });
                    },
                    activeListIds: this.props.activeListIds,
                    createTaskId: this.props.createTaskId,
                    allLists: this.props.taskLists
                }
            );
        } else {
            return this.renderTasksTable();
        }
    }
}