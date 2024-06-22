
function extractSortKey(sortKey, task) {
    switch (sortKey) {
        case SORT_KEY_DUE: {
            return isNull(task.due) ? Number.POSITIVE_INFINITY : task.due;
        }
        case SORT_KEY_NEWEST: {
            return -task.created;
        }
        case SORT_KEY_OLDEST: {
            return task.created;
        }
        case SORT_KEY_TITLE: {
            return task.title;
        }
        case SORT_KEY_DEPENDENCIES: {
            // TODO
            return task.id;
        }
    }
}

class TagInput extends React.Component {
    // props.currentTags
    // props.allTags
    // props.inputHint
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
        // should be user configurable, but I have a pretty strong opinion on this one :)
        const tagOptionsToHighlight = [
            "todo"
        ]
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
                placeholder: this.props.inputHint,
                value: this.state.currentInput,
                onChange: this.handleTextInput,
                onKeyPress: this.interceptEnter
            })
        )

        const tagOptions = [];
        const allTags = this.props.allTags;
        allTags.sort();
        for (const opt of this.props.allTags) {
            if (this.props.currentTags.includes(opt)) {
                continue;
            }
            if (opt.includes(this.state.currentInput)) {
                let tagClass = "btn-secondary"
                if (tagOptionsToHighlight.includes(opt)) {
                    tagClass = "btn-primary"
                }
                tagOptions.push(
                    div({className: "btn btn-tag " + tagClass, key: opt, onClick: () => this.selectOption(opt)},
                        opt,
                        i({className: "mdi mdi-plus-circle"})
                    )
                )
            }
        }
        return (
            div({className: "col-12"},
                div({className: "clearable-input-wrapper", key: "input"},
                    div({className: "tags-input-field form-control bg-light", key: "input"},
                        inlineElements
                    ),
                    e(
                        InputClearButton,
                        {
                            key: "clear-button",
                            onClick: () => {
                                const toRemove = Object.assign([], this.props.currentTags);
                                this.setState({
                                    currentInput: ""
                                }, () => {
                                    for (const t of toRemove) {
                                        this.props.removeTag(t);
                                    }
                                });
                            }
                        }
                    )
                ),
                div({className: "tags-available-field mt-2", key: "options"},
                    tagOptions
                )
            )
        );
    }
}

class SortInputButton extends React.Component {
    // props.sortKey
    // props.currentKey
    // props.setCurrentSortKey

    render() {
        const colorClassName = this.props.sortKey === this.props.currentKey ? "primary" : "secondary";
        return (
            button({
                type: "button",
                className: "btn btn-"+colorClassName,
                onClick: event => this.props.setCurrentSortKey(this.props.sortKey)
            }, S["tasks.table.sort." + this.props.sortKey])
        );
    }
}

class SortInput extends React.Component {
    // props.currentKey
    // props.setCurrentSortKey(sortKey)
    constructor(props) {
        super(props);
    }

    render() {
        return (
            div({className: "tasks-table-submenu-form row"},
                label({key: "label", className: "text-light col-12 col-sm-4 col-md-5 col-lg-6 col-xl-7 pl-0"}, S["tasks.table.sort"]),
                div({key: "buttons", className: "btn-group col-12 col-sm-8 col-md-7 col-lg-6 col-xl-5", role: "group"},
                    e(SortInputButton, {sortKey: SORT_KEY_NEWEST, currentKey: this.props.currentKey, setCurrentSortKey: this.props.setCurrentSortKey}),
                    e(SortInputButton, {sortKey: SORT_KEY_OLDEST, currentKey: this.props.currentKey, setCurrentSortKey: this.props.setCurrentSortKey}),
                    e(SortInputButton, {sortKey: SORT_KEY_DUE, currentKey: this.props.currentKey, setCurrentSortKey: this.props.setCurrentSortKey}),
                    e(SortInputButton, {sortKey: SORT_KEY_TITLE, currentKey: this.props.currentKey, setCurrentSortKey: this.props.setCurrentSortKey}),
                )
            )
        );
    }
}

class TasksListSubmenu extends React.Component {
    // props.currentKey
    // props.setCurrentSortKey(sortKey)
    // props.showCompletedTasks
    // props.toggleShowCompletedTasks
    // props.allTags
    // props.filterTags
    // props.addFilterTag(tag)
    // props.removeFilterTag(tag)
    constructor(props) {
        super(props);
        this.state = {
            subMenuExpanded: false,
        }
        this.toggleSubmenuExpanded = this.toggleSubmenuExpanded.bind(this);
    }

    toggleSubmenuExpanded() {
        this.setState(prevState => {
            return {
                subMenuExpanded: !prevState.subMenuExpanded
            }
        })
    }

    render() {
        const tagListItems = [];
        for (const tag of this.props.filterTags) {
            tagListItems.push(li({key: tag, className: "bg-secondary"},
                tag
            ));
        }
        return (
            div({className: "mb-3"},
                e('nav', {key: "nav", className: "navbar navbar-dark bg-dark tasks-submenu-navbar"},
                    button({key: "toggle", className:"navbar-toggler", type:"button", onClick: this.toggleSubmenuExpanded},
                        i({className:"mdi mdi-menu"})
                    ),
                    div({key: "filterTags", className: "current-tag-filters-readonly"},
                        ul({className: "text-light"}, tagListItems)
                    ),
                    button({
                            key: "showCompleted",
                            className:"navbar-toggler" + (this.props.showCompletedTasks ? " bg-secondary text-light" : ""),
                            type: "button",
                            onClick: this.props.toggleShowCompletedTasks
                        },
                        i({className: "mdi mdi-eye"})
                    )
                ),
                div({key: "sub", className: "task-submenu" + (this.state.subMenuExpanded ? " " : " collapsed")},
                    div({className: "bg-dark pl-3 pr-3"},
                        e(SortInput, {key: "sort", currentKey: this.props.currentKey, setCurrentSortKey: this.props.setCurrentSortKey}),
                        div({key: "tags", className: "tasks-table-submenu-form row"},
                            label({key: "label", className: "text-light col-12 pl-0"}, S["tasks.submenu.tag.filter.label"]),
                            e(TagInput, {
                                key: "tags",
                                inputHint: S["tasks.submenu.tag.filter.hint"],
                                currentTags: this.props.filterTags,
                                allTags: this.props.allTags,
                                addTag: this.props.addFilterTag,
                                removeTag: this.props.removeFilterTag,
                            })
                        )
                    )
                ),
            )
        );
    }
}

class CreateTaskInput extends React.Component {
    // props.initialInput
    // props.createTaskId()
    // props.openEditView(usingProperties)
    // props.trySmartSubmitUsingProps(propsToUse)
    // props.guessParentList
    // props.inputCallBack(currentInput)
    // props.currentFilterTags
    constructor(props) {
        super(props);
        this.state = {
            currentInput: props.initialInput
        }
        this.handleTextInput = this.handleTextInput.bind(this);
        this.interceptEnter = this.interceptEnter.bind(this);
    }

    handleTextInput(event) {
        let currentInput = event.target.value;
        this.props.inputCallBack(currentInput);
        this.setState({
            currentInput: currentInput
        });
    }

    interceptEnter(e) {
        if(e.nativeEvent.key === "Enter"){
            e.preventDefault();
            if (this.state.currentInput.length === 0) {
                return;
            }
            const titleToUse = e.target.value;
            this.props.inputCallBack("");
            this.setState({
                currentInput: ""
            }, () => this.props.trySmartSubmitUsingProps({
                "id": this.props.createTaskId(),
                "title": titleToUse,
                "tags": this.props.currentFilterTags,
            }));
        }
    }

    render() {
        return div({className: "clearable-input-wrapper task-input-row col-12 mb-3"},
            input({
                key: "input",
                className: "form-control",
                type: "text",
                autoComplete: "off",
                placeholder: S["tasks.table.input.hint"],
                value: this.state.currentInput,
                onChange: this.handleTextInput,
                onKeyPress: this.interceptEnter
            }),
            e(
                InputClearButton,
                {
                    key: "clear-button",
                    onClick: () => {
                        this.props.inputCallBack("");
                        this.setState({currentInput: ""});
                    }
                }
            ),
            button({
                key: "addButton",
                className: "btn btn-primary",
                disabled: this.state.currentInput === 0,
                onClick:  (event) => {
                    event.preventDefault();
                    const parentList = this.props.guessParentList()
                    const usingProperties = {
                        "id": this.props.createTaskId(),
                        "title": this.state.currentInput,
                        "tags": this.props.currentFilterTags,
                        "parentListId": parentList?.id,
                    };
                    this.props.inputCallBack("");
                    this.setState({
                        currentInput: ""
                    }, () => this.props.openEditView(usingProperties));
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

class TaskRelationShipSection extends React.Component {
    // props.title
    // props.parentList
    // props.parentListId
    // props.relatedTaskIds
    // props.handleAdd()
    // props.handleRemove(id)
    // props.goToRelatedTask(id)
    constructor(props) {
        super(props);
    }

    render() {
        const relationShips = [];
        if (!isNull(this.props.parentListId)) {
            let classesTaskBox = "text-light bg-secondary form-control col-9 col-md-8 col-lg-7";
            for (const relatedTaskId of this.props.relatedTaskIds){
                const relatedTask = this.props.parentList.tasks[relatedTaskId];
                if (!isNull(relatedTask)) {
                    relationShips.push(
                        li({
                            key: relatedTaskId,
                            className: "row"
                        },
                        div({
                            key: "task",
                            className: classesTaskBox,
                            onClick: () => {
                                this.props.goToRelatedTask(relatedTaskId);
                            }
                        }, relatedTask.title),
                        button({
                                key: "remove",
                                type: "button",
                                className: "btn btn-secondary col-2 col-md-1 ml-1 mr-1",
                                onClick: ()=>this.props.handleRemove(relatedTask.id)
                            },
                            i({className: "mdi mdi-close"})
                        )
                    ));
                }
            }
        }

        return div({className:"form-group row"},
            label({key: "label", className: "col-12 col-form-label text-light"}, this.props.title),
            div({key: "tasks-list", className: "col-12"},
                ul({key: "task-list", className: "related-tasks-list"},
                    relationShips
                ),
                button({
                        key: "add-button",
                        type: "button",
                        className: "btn btn-primary col-4 col-sm-3 col-md-2 col-lg-1",
                        onClick: this.props.handleAdd,
                        disabled: isNull(this.props.parentListId)
                    },
                    "+"
                )
            )
        )
    }
}

class TaskEditView extends React.Component {
    // props.task
    // props.requestedInitialProperties
    // props.editingDone(taskAfterEdit, parentList)
    // props.onCancel
    // props.parentList (only for edit, set to null for create)
    // props.activeListIds
    // props.allLists
    // props.editTask(task, taskList)
    // props.deleteTask(task, taskList)
    constructor(props) {
        super(props);
        let taskId;
        let header;
        let initialTitle;
        let remoteTitle;
        let initialDescription;
        let remoteDescription;
        let initialDue;
        let initialTags;
        let initialPrerequisites;
        let initialDependingTasks;
        let completed;
        let requestedInitialProperties;
        if (isNull(this.props.task)) {
            requestedInitialProperties = this.props.requestedInitialProperties;
            taskId = this.props.requestedInitialProperties["id"];
            header = S["tasks.form.title.create"];
            initialTitle = requestedInitialProperties["title"] || "";
            initialDescription = requestedInitialProperties["description"] || "";
            initialDue = "";
            initialTags = requestedInitialProperties["tags"] || [];
            initialPrerequisites = [];
            initialDependingTasks = [];
            completed = false;
        } else {
            requestedInitialProperties = {};
            taskId = this.props.task.id;
            header = S["tasks.form.title.edit"];
            initialTitle = this.props.task.title;
            initialDescription = this.props.task.description;
            remoteTitle = this.props.task.conflictingTitle;
            remoteDescription = this.props.task.conflictingDescription;
            initialDue = formatForHtmlInput(this.props.task.due);
            initialTags = this.props.task.tags;
            initialPrerequisites = this.props.task.prerequisites;
            initialDependingTasks = this.props.task.dependingTasks;
            completed = this.props.task.completed;
        }
        let parentListId;
        if (!isNull(this.props.parentList)) {
            parentListId = this.props.parentList.id;
        } else if (Object.keys(props.allLists).length === 1) {
            parentListId = Object.keys(props.allLists)[0];
        } else {
            parentListId = requestedInitialProperties["parentListId"] || null;
        }
        this.state = {
            taskId: taskId,
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
            prerequisites: initialPrerequisites,
            dependingTasks: initialDependingTasks,
            parentListId: parentListId,
            completed: completed,
            currentRadioListProps: null,
            currentModalProps: null,
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
        this.handleDueChange = this.handleDueChange.bind(this);
        this.addTag = this.addTag.bind(this);
        this.removeTag = this.removeTag.bind(this);
        this.handleAddPrerequisite = this.handleAddPrerequisite.bind(this);
        this.handleAddDepending = this.handleAddDepending.bind(this);
        this.removePrerequisite = this.removePrerequisite.bind(this);
        this.removeDepending = this.removeDepending.bind(this);
        this.getAllTaskOptions = this.getAllTaskOptions.bind(this);
        this.formValueToDate = this.formValueToDate.bind(this);
        this.clearDueDate = this.clearDueDate.bind(this);
        this.isUnChanged = this.isUnChanged.bind(this);
        this.goToRelatedTask = this.goToRelatedTask.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleDeletion = this.handleDeletion.bind(this);
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

    handleDueChange(e) {
        this.setState({
            due: e.target.value
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

    formValueToDate(formValue) {
        const dueDate = new Date(formValue);
        return isValidDate(dueDate) ? toUtcTimeStamp(dueDate) : null;
    }

    clearDueDate() {
        this.setState({
            due: ""
        });
    }

    isUnChanged() {
        const prevTask = this.props.task;
        return this.state.taskId === prevTask.id
            && this.state.title === prevTask.title
            && this.state.description === prevTask.description
            && this.state.due === prevTask.due
            && this.state.tags.equals(prevTask.tags)
            && this.state.prerequisites.equals(prevTask.prerequisites)
            && this.state.dependingTasks.equals(prevTask.dependingTasks)
            && this.state.completed === prevTask.completed
    }

    goToRelatedTask(taskId){
        const wantedList = this.props.allLists[this.state.parentListId];
        if (isNull(wantedList)) {
            return;
        }
        const wantedTask = wantedList.tasks[taskId];
        if (isNull(wantedTask)) {
            return;
        }
        const goToTask = () => {
            this.setState({
                currentModalProps: null
            }, () => this.props.editTask(wantedTask, wantedList));
        }
        if (
            this.isUnChanged()
        ) {
            goToTask();
        } else {
            this.setState({
                currentModalProps: {
                    title: S["unsaved.changes.title"],
                    message: S["unsaved.changes"],
                    saveButtonLabel: S["label.discard.and.continue"],
                    onSubmit: goToTask,
                }
            });
        }
    }

    async handleSubmit() {
        const prevTask = deepCopy(this.props.task);
        let created;
        if (!isNull(prevTask)) {
            prevTask.title = this.state.previousTitle;
            prevTask.description = this.state.previousDescription;
            created = this.props.task.created;
        } else {
            created = nowUtc();
        }
        const due = this.formValueToDate(this.state.due);
        const taskAfterEdit = {
            id: this.state.taskId,
            title: this.state.title,
            description: this.state.description,
            due: due,
            tags: this.state.tags,
            prerequisites: this.state.prerequisites,
            dependingTasks: this.state.dependingTasks,
            completed: this.state.completed,
            synced: false,
            created: created
        }
        const parentList = this.props.allLists[this.state.parentListId];
        if (!isNull(parentList)) {
            // noinspection UnnecessaryLocalVariableJS
            const success = await sendTask(taskAfterEdit, parentList, prevTask); // this explicit sending is needed for proper conflict resolution handling
            taskAfterEdit.synced = success;
            this.props.editingDone(taskAfterEdit, parentList);
        }
    }

    handleAddPrerequisite() {
        this.setState(prevState => {
            return {
                currentRadioListProps: {
                    title: S["tasks.form.task.title"],
                        currentSelection: null,
                        options: this.getAllTaskOptions(prevState.prerequisites),
                        selectionHandler: selection => {
                        this.setState(prev => {
                            const nextPrereq = Object.assign([], prev.prerequisites);
                            nextPrereq.push(selection);
                            return {
                                currentRadioListProps: null,
                                prerequisites: nextPrereq,
                            }
                        });
                    },
                }
            };
        });
    }

    handleAddDepending() {
        this.setState(prevState => {
            return {
                currentRadioListProps: {
                    title: S["tasks.form.task.title"],
                    currentSelection: null,
                    options: this.getAllTaskOptions(prevState.dependingTasks),
                    selectionHandler: selection => {
                        this.setState(prev => {
                            const nextDepending = Object.assign([], prev.dependingTasks);
                            nextDepending.push(selection);
                            return {
                                currentRadioListProps: null,
                                dependingTasks: nextDepending,
                            }
                        });
                    },
                }
            }
        });
    }
    
    removePrerequisite(taskId) {
        this.setState(prev => {
            let nextPrerequisites = Object.assign([], prev.prerequisites);
            nextPrerequisites.removeIf(t => t === taskId)
            return {
                prerequisites: nextPrerequisites
            }
        });
    }
    
    removeDepending(taskId) {
        this.setState(prev => {
            let nextDepending = Object.assign([], prev.dependingTasks);
            nextDepending.removeIf(t => t === taskId)
            return {
                dependingTasks: nextDepending
            }
        });
    }

    getAllTaskOptions(exceptions) {
        let allTasks = [];
        if (isNull(this.state.parentListId)) {
            return [];
        }

        const taskList = this.props.allLists[this.state.parentListId];
        for (const task of Object.values(taskList.tasks)) {
            if (!task.completed && task.id !== this.state.taskId && !exceptions.includes(task.id)) {
                allTasks.push({
                    id: task.id,
                    label: task.title
                });
            }
        }
        allTasks.sort(function(a, b){
            if(a.label.toLowerCase() < b.label.toLowerCase()) { return -1; }
            if(a.label.toLowerCase() > b.label.toLowerCase()) { return 1; }
            return 0;
        })
        return allTasks;
    }

    handleDeletion() {
        const listId = this.props.parentList?.id;
        if (!isNull(listId)) {

            const doDelete = async () => {
                const success = await this.props.deleteTask(this.state.taskId, listId);
                if (success) {
                    this.setState({
                        currentModalProps: null,
                    }, this.props.onCancel);
                } else {
                    this.setState({
                        currentModalProps: {
                            title: S["delete.task.title"],
                            message: S["delete.task.failed.message"],
                            saveButtonLabel: S["label.delete"],
                            onSubmit: doDelete,
                        }
                    });
                }
            }

            this.setState({
                currentModalProps: {
                    title: S["delete.task.title"],
                    message: S["delete.task.message"],
                    saveButtonLabel: S["label.delete"],
                    onSubmit: doDelete
                }
            });
        }
    }

    render() {
        const formGroups = [];
        let currentlySelectedList = this.props.allLists[this.state.parentListId];
        formGroups.push(
            div({className:"form-group row", key: "titleInput"},
                label({key: "label", htmlFor: "title-input", className: "col-6 col-form-label text-light"}, S["label.title"]),
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
                    div({className: "clearable-input-wrapper"},
                        input({
                            id: "title-input",
                            key: "title-input",
                            type: "text",
                            className: "form-control",
                            placeholder: S["label.title"],
                            autoComplete: "off",
                            value: this.state.showRemoteTitle ? this.state.remoteTitle : this.state.title,
                            onChange: this.handleTitleChange,
                            disabled: this.state.showRemoteTitle
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

        if (isNull(this.props.parentList)) {
            let buttonTitle;
            if (isNull(currentlySelectedList)) {
                buttonTitle = S["tasks.form.list.hint"];
            } else {
                buttonTitle = currentlySelectedList.title;
            }

            formGroups.push(
                div({className:"form-group row", key: "listChoice"},
                    label({key: "label", htmlFor: "list-input", className: "col-12 col-form-label text-light"}, S["tasks.form.list"]),
                    div({className: "col-12", key: "button"},
                        button({
                            type: "button",
                            className: "btn btn-secondary",
                            id: "list-input",
                            onClick: () => {
                                this.setState((prevState, prevProps) => {
                                        const availableOptions = Object.values(prevProps.allLists).map(function (l) {
                                            return {
                                                id: l.id,
                                                label: l.title
                                            }
                                        })
                                        return {
                                            currentRadioListProps: {
                                                title: S["tasks.form.list.title"],
                                                currentSelection: prevState.parentListId,
                                                options: availableOptions,
                                                selectionHandler: selection => {
                                                    this.setState({
                                                        currentRadioListProps: null,
                                                        parentListId: selection
                                                    });
                                                },
                                            },
                                        };
                                    }
                                );
                            }
                        }, buttonTitle)
                    )
                )
            );
        } else {
            formGroups.push(
                div({className:"form-group row", key: "listChoice"},
                    label({key: "label", className: "col-12 col-form-label text-light"}, S["tasks.form.list"]),
                    div({className: "col-12", key: "list-input"},
                        div({className: "text-light bg-secondary form-control"},
                            this.props.parentList?.title
                        )
                    )
                )
            );
        }

        formGroups.push(
            div({className:"form-group row", key: "descriptionInput"},
                label({key: "label", htmlFor: "description-input", className: "col-6 col-form-label text-light"}, S["tasks.form.description"]),
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

        const urls = findUrls(this.state.title + " " + this.state.description);
        const urlElemens = [];
        for (const url of urls){
            urlElemens.push(div({key: url},
                a({href: url}, url)
            ));
        }
        if (urls.length > 0) {
            formGroups.push(
                div({className:"form-group row", key: "urls"},
                    label({key: "label", className: "col-12 col-form-label text-light"}, S["tasks.form.links"]),
                    div({
                            key: "links",
                            className: "col-12 url-section"
                        },
                        urlElemens
                    )
                )
            );
        }

        const allTags = [];
        const parentList = this.props.allLists[this.state.parentListId];
        if (!isNull(parentList)) {
            for (const [taskId, task] of Object.entries(parentList.tasks)) {
                if (task.completed) {
                    continue;
                }
                for (const tag of task.tags) {
                    if (!allTags.includes(tag)) {
                        allTags.push(tag);
                    }
                }
            }
        }
        formGroups.push(
            div({className:"form-group row", key: "tags-input"},
                label({key: "label", htmlFor: "tags-input", className: "col-12 col-form-label text-light"}, S["tasks.form.tags"]),
                e(
                    TagInput,
                    {
                        inputHint: S["tasks.form.tags.hint"],
                        currentTags: this.state.tags,
                        allTags: allTags,
                        addTag: this.addTag,
                        removeTag: this.removeTag
                    }
                )
            )
        );


        formGroups.push(
            div({className:"form-group row", key: "due-input"},
                label({key: "label", className: "col-12 col-form-label text-light"}, S["tasks.form.due"]),
                div({className: "col-12", key: "input"},
                    div({className: "clearable-input-wrapper"},
                        input({
                            type: "datetime-local",
                            className: "form-control date-input",
                            value: this.state.due,
                            onChange: this.handleDueChange
                        }),
                        e(
                            InputClearButton,
                            {
                                key: "clear-button",
                                additionalClasses: "clear-date-input",
                                onClick: this.clearDueDate
                            }
                        )

                    )
                )
            )
        )

        formGroups.push(
            e(
                TaskRelationShipSection,
                {
                    key: "prereq-input",
                    title: S["tasks.form.prerequisites"],
                    relatedTaskIds: this.state.prerequisites,
                    parentList: parentList,
                    parentListId: this.state.parentListId,
                    handleAdd:  this.handleAddPrerequisite,
                    handleRemove: this.removePrerequisite,
                    goToRelatedTask: this.goToRelatedTask,
                }
            )
        );

        formGroups.push(
            e(
                TaskRelationShipSection,
                {
                    key: "depending-input",
                    title: S["tasks.form.depending"],
                    relatedTaskIds: this.state.dependingTasks,
                    parentList: parentList,
                    parentListId: this.state.parentListId,
                    handleAdd:  this.handleAddDepending,
                    handleRemove: this.removeDepending,
                    goToRelatedTask: this.goToRelatedTask,
                }
            )
        );

        if (!isNull(this.state.parentListId) && !isNull(this.props.task)) {
            formGroups.push(
                div({className:"form-group row", key: "delete-action"},
                    label({key: "label", className: "col-12 col-form-label text-light"}, S["danger.zone"]),
                    div({key: "delete-button", className: "col-12 col-form-button"},
                        button({className: "btn btn-danger col-4 col-sm-3 col-md-2 col-lg-1", type: "button", onClick: this.handleDeletion}, S["tasks.form.delete"])
                    )
                )
            );
        }

        const saveDisabled = isNull(currentlySelectedList) || this.state.showRemoteTitle || this.state.showRemoteDescription;

        let currentModal;
        if (!isNull(this.state.currentModalProps)) {
            currentModal = e(
                ModalDialog,
                {
                    key: "modal",
                    title: this.state.currentModalProps.title,
                    saveButtonLabel: this.state.currentModalProps.saveButtonLabel,
                    onCancel: () => this.setState({
                        currentModalProps: null,
                        currentRadioListProps: null,
                    }),
                    onSubmit: this.state.currentModalProps.onSubmit
                },
                div({},
                    p({}, this.state.currentModalProps.message)
                )
            );
        } else if (!isNull(this.state.currentRadioListProps)) {
            currentModal = e(
                ModalDialog,
                {
                    key: "modal",
                    title: this.state.currentRadioListProps.title,
                    onCancel: () => this.setState({
                        currentRadioListProps: null
                    }),
                },
                e(
                    RadioList,
                    {
                        currentSelection: this.state.currentRadioListProps.currentSelection,
                        availableOptions: this.state.currentRadioListProps.options,
                        handleSelection: this.state.currentRadioListProps.selectionHandler
                    }
                )
            );
        } else {
            currentModal = null;
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
                    button({
                            className: "w-100 btn btn-lg btn-primary",
                            type: "submit",
                            key: "submit",
                            disabled: saveDisabled,
                            onClick: event => {
                                event.preventDefault();
                                return this.handleSubmit(event);
                            }
                        },
                        S["label.save"]
                    )
                )
            ),
            currentModal
        ];
    }
}

class TasksView extends React.Component {
    // props.taskLists
    // props.activeListIds
    // props.createTaskId
    // props.onTaskUpdatedLocally(task, taskList)
    // props.sortingKey
    // props.setCurrentSortingKey(sortKey)
    // props.currentFilterString
    // props.showCompletedTasks
    // props.toggleShowCompletedTasks
    // props.filterTags
    // props.addFilterTag(tag)
    // props.removeFilterTag(tag)
    // props.createWith
    // props.resetCreateWith
    // props.deleteTask(task, taskList)
    // props.defaultListId
    constructor(props) {
        super(props);
        this.state = {
            editingTask: null,
            editingList: null,
            currentFilterString: "",
            requestedInitialProperties: this.props.createWith || undefined
        }
        this.renderTasksTable = this.renderTasksTable.bind(this);
        this.addTask = this.addTask.bind(this);
        this.editTask = this.editTask.bind(this);
        this.toggleTaskComplete = this.toggleTaskComplete.bind(this);
        this.onTaskEdited = this.onTaskEdited.bind(this);
        this.trySmartSubmitUsingProps = this.trySmartSubmitUsingProps.bind(this);
        this.guessParentList = this.guessParentList.bind(this);
    }

    addTask(taskLists, usingProperties) {
        this.setState({
            editingTask: null,
            editingList: null,
            requestedInitialProperties: usingProperties,
        });
    }

    editTask(task, taskList) {
        this.setState({
            editingTask: task,
            editingList: taskList,
            requestedInitialProperties: null,
        });
    }

    async toggleTaskComplete(event, task, taskList) {
        event.preventDefault();
        const taskAfterEdit = deepCopy(task);
        taskAfterEdit.completed = !taskAfterEdit.completed;
        taskAfterEdit.synced = false;
        await this.props.onTaskUpdatedLocally(taskAfterEdit, taskList);
    }

    async trySmartSubmitUsingProps(propsToUse) {
        const parentList = this.guessParentList();
        if (isNull(parentList)) {
            return this.addTask(this.props.taskLists, propsToUse);
        } else {
            return this.onTaskEdited({
                id: this.props.createTaskId(),
                created: nowUtc(),
                title: propsToUse["title"],
                description: "",
                due: null,
                tags: propsToUse["tags"],
                prerequisites: [],
                dependingTasks: [],
                synced: false,
                completed: false
            }, parentList);
        }
    }

    guessParentList() {
        if (Object.keys(this.props.taskLists).length === 1) {
            return this.props.taskLists[Object.keys(this.props.taskLists)[0]];
        } else if (this.props.activeListIds.length === 1) {
            return this.props.taskLists[this.props.activeListIds[0]];
        } else {
            return this.props.taskLists[this.props.defaultListId] || null;
        }
    }

    async onTaskEdited(taskAfterEdit, parentList) {
        await this.props.resetCreateWith();
        await this.props.onTaskUpdatedLocally(taskAfterEdit, parentList);
        this.setState({editingTask: null, editingList: null, requestedInitialProperties: null});
    }

    renderTasksTable() {
        let rows = [];
        for (const [taskListId, taskList] of Object.entries(this.props.taskLists)) {
            if (!this.props.activeListIds.includes(taskListId)) {
                continue;
            }
            let tasks = taskList.tasks;
            const currentFilter = this.state.currentFilterString.toLowerCase();
            tasksLoop:
                for (const [taskId, task] of Object.entries(tasks)) {
                    if (task.completed && !this.props.showCompletedTasks) {
                        continue;
                    }
                    if (currentFilter.length > 0 && !task.title.toLowerCase().includes(currentFilter)) {
                        continue;
                    }
                    for (const filterTag of this.props.filterTags) {
                        if (!task.tags.includes(filterTag)) {
                            continue tasksLoop;
                        }
                    }
                    const actionButtonColorType = task.completed ? "secondary" : "primary";
                    const titleColorClass = "task-title-section" + (hasConflicts(task) ? " text-danger" : "");

                    const sortKeyValue = extractSortKey(this.props.sortingKey, task) || 0;

                    const dates = [
                        span({key: "created"}, formatDate(task.created))
                    ];
                    if (!isNull(task.due)) {
                        let dueClass;
                        const now = nowUtc();
                        if (task.due < now){
                            dueClass = "text-danger";
                        } else if (task.due - now < 3 * 24 * 60 * 60 * 1000) {
                            dueClass = "text-warning";
                        } else {
                            dueClass = "text-success";
                        }

                        dates.push(span({key: "date-connector", className: "date-connector"}, i({className: "mdi mdi-arrow-right"})));
                        dates.push(span({key: "due-date", className: dueClass}, formatDateTime(task.due)));
                    }

                    rows.push(
                        div({key: taskId, "data-sort-key-value": sortKeyValue, className: "task-entry text-light"},
                            div(
                                {
                                    key: "title",
                                    className: "text-left tasks-list-main-cell text-light",
                                    onClick: (event) => {
                                        event.preventDefault();
                                        this.editTask(task, taskList);
                                    }
                                },
                                div({className: titleColorClass, key: "title"}, task.title),
                                div({className: "task-detail-info text-secondary", key: "task-detail-info"},
                                    dates
                                )
                            ),
                            div(
                                {key: "action", className: "task-entry-action"},
                                button({
                                    className: "btn btn-" + actionButtonColorType,
                                    onClick: (event) => this.toggleTaskComplete(event, task, taskList)
                                }, i({className: "mdi mdi-" + (task.completed ? "check" : "checkbox-blank-outline")}))
                            )
                        )
                    );
                }
        }
        if (this.props.sortingKey === SORT_KEY_TITLE) {
            rows.sort((r1, r2) => r1.props["data-sort-key-value"].localeCompare(r2.props["data-sort-key-value"], "en", { numeric: true }));
        } else {
            rows.sort((r1, r2) => r1.props["data-sort-key-value"] - r2.props["data-sort-key-value"]);
        }
        return [
            div({key: "add-task", className: "row"},
                e(
                    CreateTaskInput,
                    {
                        initialInput: this.state.currentFilterString,
                        createTaskId: this.props.createTaskId,
                        guessParentList: this.guessParentList,
                        trySmartSubmitUsingProps: this.trySmartSubmitUsingProps,
                        openEditView: (usingProperties) => {
                            return this.addTask(this.props.taskLists, usingProperties);
                        },
                        currentFilterTags: this.props.filterTags,
                        inputCallBack: text => this.setState({currentFilterString: text}),
                    }
                )
            ),
            div({key: "header", className: "row tasks-list-header"},
                div({key: "title", className: "col-6 text-left text-light bg-dark"}, S["tasks.table.header.title"]),
                div({key: "action", className: "col-6 text-right text-light bg-dark"}, S["tasks.table.header.action"])
            ),
            div({key: "body", className: "row m-0"},
                div({className: "col-12 tasks-list pl-0 pr-0"},
                    rows
                )
        )];
    }

    render() {
        const allTags = [];
        for (const [taskListId, taskList] of Object.entries(this.props.taskLists)) {
            if (this.props.activeListIds.includes(taskListId)) {
                for (const [taskId, task] of Object.entries(taskList.tasks)) {
                    if (task.completed) {
                        continue;
                    }
                    for (const tag of task.tags) {
                        if (!allTags.includes(tag)) {
                            allTags.push(tag);
                        }
                    }
                }
            }
        }
        if (!isNull(this.state.requestedInitialProperties) || !isNull(this.state.editingTask)) {
            let key = this.state.editingTask?.id || this.state.requestedInitialProperties["id"];
            return e(
                TaskEditView,
                {
                    key: key,
                    task: this.state.editingTask,
                    requestedInitialProperties: this.state.requestedInitialProperties,
                    parentList: this.state.editingList,
                    editingDone: async (taskAfterEdit, parentList) => {
                        cleanupUrl();
                        await this.onTaskEdited(taskAfterEdit, parentList);
                    },
                    onCancel: () => {
                        this.setState({ editingTask: null, editingList: null, requestedInitialProperties: null }, cleanupUrl);
                    },
                    activeListIds: this.props.activeListIds,
                    allLists: this.props.taskLists,
                    editTask: this.editTask,
                    deleteTask: this.props.deleteTask,
                }
            );
        } else {
            return [
                e(TasksListSubmenu, {
                    key: "submenu",
                    currentKey: this.props.sortingKey,
                    setCurrentSortKey: this.props.setCurrentSortKey,
                    showCompletedTasks: this.props.showCompletedTasks,
                    toggleShowCompletedTasks: this.props.toggleShowCompletedTasks,
                    filterTags: this.props.filterTags,
                    allTags: allTags,
                    addFilterTag: this.props.addFilterTag,
                    removeFilterTag: this.props.removeFilterTag,
                }),
                this.renderTasksTable(),
            ];
        }
    }
}