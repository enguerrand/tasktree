class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            authorizationError: null,
            loggedInUser: null,
            taskLists: {},
            activeListIds: [],
            online: true,
            currentCategory: CATEGORY_ID_TASKS
        };
        this.createListId = this.createListId.bind(this);
        this.createTaskId = this.createTaskId.bind(this);
        this.storeUserSettings = this.storeUserSettings.bind(this);
        this.fetchUserSettings = this.fetchUserSettings.bind(this);
        this.onLoginReply = this.onLoginReply.bind(this);
        this.writeUnsyncedLists = this.writeUnsyncedLists.bind(this);
        this.writeUnsyncedTasks = this.writeUnsyncedTasks.bind(this);
        this.writeAll = this.writeAll.bind(this);
        this.fetchLists = this.fetchLists.bind(this);
        this.onListUpdatedLocally = this.onListUpdatedLocally.bind(this);
        this.onTaskUpdatedLocally = this.onTaskUpdatedLocally.bind(this);
        this.updateOnlineStatus = this.updateOnlineStatus.bind(this);
        this.setListActive = this.setListActive.bind(this);
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
                asyncRequests.push(this.writeUnsyncedTasks(localList));
            } else {
                asyncRequests.push(
                    sendTaskList(localList).then(success => {
                        if (success) {
                            this.setState(
                                immer.produce(draftState => {
                                    draftState.taskLists[listId].synced = true;
                                })
                            );
                            this.writeUnsyncedTasks(localList);
                        }
                    })
                );
            }
        }
        await Promise.all(asyncRequests);
        await this.fetchLists();
    }

    async writeUnsyncedTasks(taskList) {
        const asyncRequests = [];
        for (const [taskId, localTask] of Object.entries(taskList.tasks)) {
            if (localTask.synced) {
                continue;
            }
            asyncRequests.push(
                sendTask(localTask, taskList, taskList.remoteTasks[taskId])
            )
        }
        await Promise.all(asyncRequests);
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
                            const remoteTasks = remoteList.tasks.reduce((a, t) => ({...a, [t.id]: t}), {});
                            if (isNull(current) || current.synced) {
                                let tasks;
                                if (isNull(current)) {
                                    tasks = deepCopy(remoteTasks);
                                    for (const [taskId, task] of Object.entries(tasks)) {
                                        task.synced = true;
                                    }
                                } else {
                                    tasks = current.tasks;
                                    for (const task of remoteList.tasks) {
                                        const currentTask = current.tasks[task.id];
                                        if (isNull(currentTask) || currentTask.synced) {
                                            tasks[task.id] = task;
                                            tasks[task.id].synced = true;
                                        } else {
                                            tasks[task.id] = currentTask;
                                        }
                                    }
                                    const remoteIds = remoteList.tasks.map(t => t.id);
                                    for (const [taskId, task] of Object.entries(tasks)) {
                                        if (task.synced && !remoteIds.includes(task.id)) {
                                            delete tasks[taskId];
                                        }
                                    }
                                }
                                draftState.taskLists[remoteList.id] = {
                                    id: remoteList.id,
                                    title: remoteList.title,
                                    synced: true,
                                    tasks: tasks,
                                    remoteTasks: remoteTasks
                                };
                            } else {
                                current.remoteTasks = remoteTasks;
                            }
                        }
                        const remoteIds = lists.map(t => t.id);
                        for (const [listId, taskList] of Object.entries(draftState.taskLists)) {
                            // FIXME check for undefined?
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

    async onLoginReply(sentUsername, authorizationSuccess) {
        if (authorizationSuccess) {
            this.setState({loggedInUser: sentUsername, authorizationError: null}, this.fetchUserSettings);
        } else {
            this.setState({loggedInUser: null, authorizationError: "Access denied!"});
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

    async onTaskUpdatedLocally(task, taskList) {
        console.log("task updated: " + JSON.stringify(task));
        this.setState(
            immer.produce(draftState => {
                draftState.taskLists[taskList.id].tasks[task.id] = deepCopy(task);
            }), this.writeUnsyncedLists
        );
    }

    async updateOnlineStatus() {
        const online = navigator.onLine;
        console.log("online state changed: " + String(online));
        this.setState({
            online: online
        })
        if (online) {
            this.writeAll();
        }
    }

    async writeAll() {
        this.writeUnsyncedLists();
        this.storeUserSettings();
    }

    async setListActive(listId, active) {
        this.setState(prevState => {
            const newLists = Object.assign([], prevState.activeListIds);
            if (active && !newLists.includes(listId)) {
                newLists.push(listId);
            } else if (!active) {
                newLists.removeIf(id => id === listId);
            }
            return {
                activeListIds: newLists
            }
        }, this.storeUserSettings)
    }

    async storeUserSettings() {
        const settings = {
            activeListIds: Object.assign([], this.state.activeListIds)
        };
        return sendSettings(settings);
    }

    async fetchUserSettings() {
        const jsonResult = await getJson(API_URL_USERS + '/current');
        jsonResult.handle(
            currentUser => {
                if (currentUser !== null && currentUser.username !== null && currentUser.username !== undefined) {
                    const parsedSettings = readSettings(currentUser);
                    this.setState({
                        loggedInUser: currentUser.username,
                        activeListIds: parsedSettings.activeListIds
                    }, this.fetchLists);
                }
            },
            errorMessage => {
                console.log(errorMessage);
            }
        );
    }

    async componentDidMount() {
        window.addEventListener('online', this.updateOnlineStatus);
        window.addEventListener('offline', this.updateOnlineStatus);
        this.fetchUserSettings();
    }

    render() {
        if (this.state.loggedInUser === null) {
            return e(LoginForm, {onServerReply: this.onLoginReply, errorMessage: this.state.authorizationError});
        } else {
            return [
                e(NavBar, {
                    key: "navbar",
                    online: this.state.online,
                    currentCategory: this.state.currentCategory,
                    setCategory: cat => this.setState({
                        currentCategory: cat
                    })
                }),
                e(MainView, {
                    key: "main-view",
                    category: this.state.currentCategory,
                    taskLists: this.state.taskLists,
                    activeListIds: this.state.activeListIds,
                    setListActive: this.setListActive,
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
