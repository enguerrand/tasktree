class TaskEditView extends React.Component {
    // props.task
    // props.editingDone(taskAfterEdit)
    // props.createTaskId
    constructor(props) {
        super(props);
        let header;
        let initialTitle;
        if (isNull(this.props.taskTask)) {
            header = "Create task";
            initialTitle = "";
        } else {
            header = "Edit task";
            initialTitle = this.props.task.title;
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
        const taskAfterEdit = {
            title: title,
            synced: false
        }
        if (isNull(this.props.task)) {
            taskAfterEdit.id = this.props.createListId();
        } else {
            taskAfterEdit.id = this.props.task.id;
            if (!isNull(this.props.task.id)) {
                taskAfterEdit.id = this.props.task.id;
            }
        }

        const success = await sendTaskList(taskAfterEdit);
        taskAfterEdit.synced = success;
        this.props.editingDone(taskAfterEdit);
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

class TasksView extends React.Component {
    // props.taskLists
    constructor(props) {
        super(props);
        this.state = {
            editingTask: null,
            createNew: false
        }
        this.renderTasksTable = this.renderTasksTable.bind(this);
        this.addTask = this.addTask.bind(this);
        this.editTask = this.editTask.bind(this);
    }

    addTask(event) {
        event.preventDefault();
        this.setState({
            createNew: true
        });
    }

    editTask(event, task) {
        event.preventDefault();
        this.setState({
            editingTask: task
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
                            button({className: "btn btn-primary", onClick: (event) => this.editTask(event, task)}, i({className: "mdi mdi-pencil-outline"}))
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
                    onClick:  this.addTask
                }, "+")
            )
        );
    }

    render() {
        return this.renderTasksTable();
    }
}