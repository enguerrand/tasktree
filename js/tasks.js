
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
            div({className: "tasks-table-submenu-form"},
                label({key: "label", className: "text-light"}, S["tasks.table.sort"]),
                div({key: "buttons", className: "btn-group col-8", role: "group"},
                    e(SortInputButton, {sortKey: SORT_KEY_NEWEST, currentKey: this.props.currentKey, setCurrentSortKey: this.props.setCurrentSortKey}),
                    e(SortInputButton, {sortKey: SORT_KEY_OLDEST, currentKey: this.props.currentKey, setCurrentSortKey: this.props.setCurrentSortKey}),
                    e(SortInputButton, {sortKey: SORT_KEY_DUE, currentKey: this.props.currentKey, setCurrentSortKey: this.props.setCurrentSortKey}),
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
    // props.openEditView(initialTitle)
    // props.trySmartSubmitUsingTitle(title)
    // props.inputCallBack(currentInput)
    constructor(props) {
        super(props);
        this.state = {
            currentInput: ""
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
            const titleToUse = e.target.value;
            if (this.state.currentInput.length === 0) {
                return;
            }
            this.props.inputCallBack("");
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
                    const usingTitle = this.state.currentInput;
                    this.props.inputCallBack("");
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
        let taskId;
        let header;
        let initialTitle;
        let remoteTitle;
        let initialDescription;
        let remoteDescription;
        let initialTags;
        let initialPrerequisites;
        let initialDependingTasks;
        let completed;
        if (isNull(this.props.task)) {
            taskId = this.props.createTaskId();
            header = S["tasks.form.title.create"];
            initialTitle = this.props.requestedNewTitle;
            initialDescription = "";
            initialTags = [];
            completed = false;
        } else {
            taskId = this.props.task.id;
            header = S["tasks.form.title.edit"];
            initialTitle = this.props.task.title;
            initialDescription = this.props.task.description;
            remoteTitle = this.props.task.conflictingTitle;
            remoteDescription = this.props.task.conflictingDescription;
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
            parentListId = null;
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
            tags: initialTags,
            prerequisites: initialPrerequisites,
            dependingTasks: initialDependingTasks,
            parentListId: parentListId,
            completed: completed,
            listChoiceModalVisible: false,
            prereqChoiceModalVisible: false,
            dependingChoiceModalVisible: false,
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
        this.handleAddPrerequisite = this.handleAddPrerequisite.bind(this);
        this.handleAddDepending = this.handleAddDepending.bind(this);
        this.getAllTaskOptions = this.getAllTaskOptions.bind(this);
        this.deriveInitialDue = this.deriveInitialDue.bind(this);
        this.clearDueDate = this.clearDueDate.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.dateInputRef = React.createRef();
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

    deriveInitialDue() {
        let due = this.props.task?.due;
        if (isNull(due)) {
            return undefined;
        } else {
            try {
                return new Date(fromUtcTimeStamp(due)).toISOString().substring(0, 10);
            } catch (e) {
                return undefined;
            }
        }
    }

    clearDueDate() {
        this.dateInputRef.current.value = "";
    }

    async handleSubmit(event) {
        event.preventDefault();
        const prevTask = deepCopy(this.props.task);
        let created;
        if (!isNull(prevTask)) {
            prevTask.title = this.state.previousTitle;
            prevTask.description = this.state.previousDescription;
            created = this.props.task.created;
        } else {
            created = nowUtc();
        }
        const dueDate = new Date(this.dateInputRef.current.value);
        const due = isValidDate(dueDate) ? toUtcTimeStamp(dueDate) : null;
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
        this.setState({
            prereqChoiceModalVisible: true,
        });
    }

    handleAddDepending() {
        this.setState({
            dependingChoiceModalVisible: true,
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
                    label({key: "label", htmlFor: "list-input", className: "col-12 col-form-label text-light"}, S["tasks.form.list"]),
                    div({className: "col-12", key: "button"},
                        button({
                            type: "button",
                            className: "btn btn-secondary",
                            id: "list-input",
                            onClick: () => {
                                this.setState({
                                    listChoiceModalVisible: true
                                });
                            }
                        }, buttonTitle)
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
                        input({type: "date", className: "form-control", defaultValue: this.deriveInitialDue(), ref: this.dateInputRef}),
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

        const prerequisites = [];
        const dependingTasks = [];
        const parentListId = this.state.parentListId;
        if (!isNull(parentList)) {
            for (const prereqId of this.state.prerequisites){
                const prereqTask = this.props.allLists[parentListId]?.tasks[prereqId];
                if (!isNull(prereqTask)) {
                    prerequisites.push(li({
                            key: prereqId,
                            className: "list-group-item",
                            onClick: () => {
                                // TODO: open task? or remove prereq?
                            }
                        },
                        prereqTask.title
                    ));
                }
            }
            for (const dependingId of this.state.dependingTasks){
                const dependingTask = this.props.allLists[parentListId]?.tasks[dependingId];
                if (!isNull(dependingTask)) {
                    dependingTasks.push(li({
                            key: dependingId,
                            className: "list-group-item",
                            onClick: () => {
                                // TODO: open task? or remove depending?
                            }
                        },
                        dependingTask.title
                    ));
                }
            }
        }
        formGroups.push(
            div({className:"form-group row", key: "prereq-input"},
                label({key: "label", className: "col-12 col-form-label text-light"}, S["tasks.form.prerequisites"]),
                div({key: "tasks-list", className: "col-12"},
                    ul({key: "task-list", className: "list-group related-tasks-list"},
                        prerequisites
                    ),
                    button({
                            key: "add-button",
                            type: "button",
                            className: "btn btn-primary",
                            onClick: this.handleAddPrerequisite,
                            disabled: isNull(this.state.parentListId)
                        },
                        "+"
                    )
                )
            )
        )

        formGroups.push(
            div({className:"form-group row", key: "depending-input"},
                label({key: "label", className: "col-12 col-form-label text-light"}, S["tasks.form.depending"]),
                div({key: "tasks-list", className: "col-12"},
                    ul({key: "task-list", className: "list-group related-tasks-list"},
                        dependingTasks
                    ),
                    button({
                            key: "add-button",
                            type: "button",
                            className: "btn btn-primary",
                            onClick: this.handleAddDepending,
                            disabled: isNull(this.state.parentListId)
                        },
                        "+"
                    )
                )
            )
        )

        const saveDisabled = isNull(currentlySelectedList) || this.state.showRemoteTitle || this.state.showRemoteDescription;

        let currentModal;
        if (this.state.listChoiceModalVisible || this.state.prereqChoiceModalVisible || this.state.dependingChoiceModalVisible) {
            let availableOptions;
            let title;
            let currentSelection;
            let selectionHandler;
            if (this.state.listChoiceModalVisible) {
                title = S["tasks.form.list.title"];
                currentSelection = this.state.parentListId;
                for (const taskList of Object.values(this.props.allLists)) {
                    availableOptions.push({
                        id: taskList.id,
                        label: taskList.title
                    });
                }
                selectionHandler = selection => {
                    this.setState({
                        listChoiceModalVisible: false,
                        parentListId: selection
                    });
                };
            } else {
                title = S["tasks.form.task.title"];
                let exceptions;
                if (this.state.prereqChoiceModalVisible) {
                    exceptions = this.state.prerequisites;
                } else if (this.state.dependingChoiceModalVisible) {
                    exceptions = this.state.dependingTasks;
                }
                availableOptions = this.getAllTaskOptions(exceptions);
                currentSelection = null;
                selectionHandler = selection => {
                    this.setState(prev => {
                        let nextPrereq = Object.assign([], prev.prerequisites);
                        let nextDepending = Object.assign([], prev.dependingTasks);
                        if (prev.prereqChoiceModalVisible) {
                            nextPrereq.push(selection);
                        } else if (prev.dependingChoiceModalVisible) {
                            nextDepending.push(selection);
                        } else {
                            console.error("unexpected: don't know if choosing dependency or depending tasks");
                            return prev;
                        }
                        return {
                            listChoiceModalVisible: false,
                            prereqChoiceModalVisible: false,
                            dependingChoiceModalVisible: false,
                            prerequisites: nextPrereq,
                            dependingTasks: nextDepending,
                        }
                    });
                };
            }
            currentModal = e(
                ModalDialog,
                {
                    key: "modal",
                    title: title,
                    onCancel: () => this.setState({
                        listChoiceModalVisible: false,
                        prereqChoiceModalVisible: false,
                        dependingChoiceModalVisible: false,
                    }),
                },
                e(
                    RadioList,
                    {
                        currentSelection: currentSelection,
                        availableOptions: availableOptions,
                        handleSelection: selectionHandler
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
                    button({className: "w-100 btn btn-lg btn-primary", type: "submit", key: "submit", disabled: saveDisabled, onClick: this.handleSubmit },
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
    constructor(props) {
        super(props);
        this.state = {
            editingTask: null,
            editingList: null,
            currentFilterString: "",
        }
        this.renderTasksTable = this.renderTasksTable.bind(this);
        this.addTask = this.addTask.bind(this);
        this.editTask = this.editTask.bind(this);
        this.toggleTaskComplete = this.toggleTaskComplete.bind(this);
        this.onTaskEdited = this.onTaskEdited.bind(this);
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

    async toggleTaskComplete(event, task, taskList) {
        event.preventDefault();
        const taskAfterEdit = deepCopy(task);
        taskAfterEdit.completed = !taskAfterEdit.completed;
        taskAfterEdit.synced = false;
        await this.props.onTaskUpdatedLocally(taskAfterEdit, taskList);
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
            return this.onTaskEdited({
                id: this.props.createTaskId(),
                created: nowUtc(),
                title: title,
                description: "",
                due: null,
                tags: this.props.filterTags,
                synced: false,
                completed: false
            }, parentList);
        }
    }

    async onTaskEdited(taskAfterEdit, parentList) {
        await this.props.onTaskUpdatedLocally(taskAfterEdit, parentList);
        this.setState({editingTask: null, editingList: null, createNewWithTitle: null});
    }

    renderTasksTable() {
        let rows = [];
        rows.push(
            tr({key: "add-task", "data-sort-key-value": Number.NEGATIVE_INFINITY},
                td({colSpan: 2},
                    e(
                        CreateTaskInput,
                        {
                            trySmartSubmitUsingTitle: this.trySmartSubmitUsingTitle,
                            openEditView: (usingTitle) => {
                                return this.addTask(this.props.taskLists, usingTitle);
                            },
                            inputCallBack: text => this.setState({currentFilterString: text}),
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
            const currentFilter = this.state.currentFilterString;
            tasksLoop:
                for (const [taskId, task] of Object.entries(tasks)) {
                    if (task.completed && !this.props.showCompletedTasks) {
                        continue;
                    }
                    if (currentFilter.length > 0 && !task.title.includes(currentFilter)) {
                        continue;
                    }
                    for (const filterTag of this.props.filterTags) {
                        if (!task.tags.includes(filterTag)) {
                            continue tasksLoop;
                        }
                    }
                    const actionButtonColorType = task.completed ? "secondary" : "primary";
                    const titleColorClass = hasConflicts(task) ? "text-danger" : "";

                    const sortKeyValue = extractSortKey(this.props.sortingKey, task) || 0;
                    rows.push(
                        tr({key: taskId, "data-sort-key-value": sortKeyValue},
                            // th({key: "id", scope: "row", className: "align-middle"}, taskId),
                            td(
                                {
                                    key: "title",
                                    className: "align-middle tasks-table-main-cell",
                                    onClick: (event) => this.editTask(event, task, taskList)
                                },
                                div({className: titleColorClass, key: "title"}, task.title),
                                div({className: "task-detail-info text-secondary", key: "created"}, formatDate(task.created))
                            ),
                            td(
                                {key: "action", className: "right align-middle"},
                                button({
                                    className: "btn btn-" + actionButtonColorType,
                                    onClick: (event) => this.toggleTaskComplete(event, task, taskList)
                                }, i({className: "mdi mdi-" + (task.completed ? "check" : "checkbox-blank-outline")}))
                            )
                        )
                    );
                }
        }
        rows.sort((r1, r2) => r1.props["data-sort-key-value"] - r2.props["data-sort-key-value"]);
        const tasksTable = table({className: "table table-striped table-dark", key: "table"},
            thead({key: "head"},
                tr(null,
                    // th({key: "id", scope: "col", className: "align-middle"}, "ID"),
                    th({key: "title", scope: "col", className: "align-middle"}, S["tasks.table.header.title"]),
                    th({key: "action", scope: "col", className: "right align-middle"}, S["tasks.table.header.action"])
                )
            ),
            tbody({key: "body"}, rows)
        )
        return div({ className: "row", key: "tasks-table" },
            div({ className: "col-12" },
                tasksTable
            )
        );
    }

    render() {
        const allTags = [];
        for (const [taskListId, taskList] of Object.entries(this.props.taskLists)) {
            if (this.props.activeListIds.includes(taskListId)) {
                for (const [taskId, task] of Object.entries(taskList.tasks)) {
                    for (const tag of task.tags) {
                        if (!allTags.includes(tag)) {
                            allTags.push(tag);
                        }
                    }
                }
            }
        }
        if (!isNull(this.state.createNewWithTitle) || !isNull(this.state.editingTask)) {
            return e(
                TaskEditView,
                {
                    task: this.state.editingTask,
                    requestedNewTitle: this.state.createNewWithTitle,
                    parentList: this.state.editingList,
                    editingDone: async (taskAfterEdit, parentList) => {
                        await this.onTaskEdited(taskAfterEdit, parentList);
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