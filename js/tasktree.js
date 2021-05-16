class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedInUser: null,
            taskLists: {},
            online: true,
            currentCategory: CATEGORY_ID_TASKS
        };
        this.createListId = this.createListId.bind(this);
        this.createTaskId = this.createTaskId.bind(this);
        this.onLoginReply = this.onLoginReply.bind(this);
        this.writeUnsyncedLists = this.writeUnsyncedLists.bind(this);
        this.fetchAll = this.fetchAll.bind(this);
        this.fetchLists = this.fetchLists.bind(this);
        this.onListUpdatedLocally = this.onListUpdatedLocally.bind(this);
        this.onTaskUpdatedLocally = this.onTaskUpdatedLocally.bind(this);
        this.updateOnlineStatus = this.updateOnlineStatus.bind(this);
    }

    // TODO generate truly unique ids
    createListId() {
        let candidate = Date.now();
        while (!isNull(this.state.taskLists[String(candidate)])) {
            candidate = candidate + 1;
        }
        return candidate;
    }

    // TODO generate truly unique ids
    createTaskId() {
        return this.createListId();
    }

    async writeUnsyncedLists() {
        const asyncRequests = [];
        for (const [listId, localList] of Object.entries(this.state.taskLists)) {
            if (localList.synced) {
                continue;
            }
            asyncRequests.push(
                sendTaskList(localList).then(success => {
                    if (success) {
                        this.setState(
                            immer.produce(draftState => {
                                draftState.taskLists[listId].synced = true;
                            })
                        );
                    }
                })
            );
        }
        await Promise.all(asyncRequests);
        await this.fetchLists();
    }

    async fetchLists() {
        const result = await getJson(API_URL_LISTS);
        result.handle(
            lists => {
                this.setState(
                    immer.produce(draftState => {
                        for (let taskListIndex = 0; taskListIndex < lists.length; taskListIndex++) {
                            const remoteList = lists[taskListIndex];
                            const current = draftState.taskLists[remoteList.id];
                            if (isNull(current) || current.synced) {
                                draftState.taskLists[remoteList.id] = {
                                    id: remoteList.id,
                                    title: remoteList.title,
                                    synced: true,
                                    // TODO: conflict resolution
                                    tasks: remoteList.tasks.reduce((a,t) => ({...a, [t.id]: t}), {})
                                };
                            }
                        }
                        const remoteIds = lists.map(t => t.id);
                        for (const [listId, taskList] of Object.entries(draftState.taskLists)) {
                            // FIXME check for undefined
                            if (taskList.synced && !remoteIds.includes(taskList.id)) {
                                delete draftState.taskLists[listId];
                            }
                        }
                    })
                );
            },
            errorMessage => console.log(errorMessage)
        );
    }

    async fetchAll() {
        this.fetchLists();
    }

    async onLoginReply(sentUsername, authorizationSuccess) {
        if (authorizationSuccess) {
            this.setState({loggedInUser: sentUsername}, this.fetchAll);
        } else {
            this.setState({loggedInUser: null});
        }
    }

    async onListUpdatedLocally(taskList) {
        console.log("list updated: " + JSON.stringify(taskList));
        this.setState(
            immer.produce(draftState => {
                draftState.taskLists[taskList.id] = taskList;
            }), this.writeUnsyncedLists
        );
    }

    async onTaskUpdatedLocally(task) {
        console.log("task updated: " + JSON.stringify(task));
        // FIXME impl
    }

    async updateOnlineStatus() {
        const online = navigator.onLine;
        console.log("online state changed: " + String(online));
        this.setState({
            online: online
        })
        if (online) {
            this.writeUnsyncedLists();
        }
    }

    async componentDidMount() {
        window.addEventListener('online', this.updateOnlineStatus);
        window.addEventListener('offline', this.updateOnlineStatus);
        const jsonResult = await getJson(API_URL_USERS + '/current');
        jsonResult.handle(
            currentUser => {
                if (currentUser !== null && currentUser.username !== null && currentUser.username !== undefined) {
                    this.setState({
                        loggedInUser: currentUser.username
                    }, this.fetchAll);
                }
            },
            errorMessage => {
                console.log(errorMessage);
            }
        );
    }

    render() {
        if (this.state.loggedInUser === null) {
            return e(LoginForm, {onServerReply: this.onLoginReply});
        } else {
            return [
                e(NavBar, {
                    key: "navbar",
                    currentCategory: this.state.currentCategory,
                    setCategory: cat => this.setState({
                        currentCategory: cat
                    })
                }),
                e(MainView, {
                    key: "main-view",
                    category: this.state.currentCategory,
                    taskLists: this.state.taskLists,
                    onListUpdatedLocally: this.onListUpdatedLocally,
                    onTaskUpdatedLocally: this.onTaskUpdatedLocally,
                    createListId: this.createListId,
                    createTaskId: this.createTaskId
                })
            ];
        }
    }
}

window.onload = function () {
    const domContainer = document.querySelector('#tasktree');
    ReactDOM.render(
        React.createElement(TaskTreeApp), domContainer
    );
}
