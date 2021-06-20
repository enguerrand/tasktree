class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            authorizationError: null,
            loggedInUser: null,
            taskLists: {},
            activeListIds: [],
            online: true,
            listsSynced: true,
            settingsSynced: true,
            currentCategory: CATEGORY_ID_TASKS,
            tasksSortingKey: SORT_KEY_DEFAULT,
            showCompletedTasks: false,
            allUsers: [],
            filterTags: [],
            defaultListId: null,
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
        this.beforeUnload = this.beforeUnload.bind(this);
        this.setListActive = this.setListActive.bind(this);
        this.deleteTask = this.deleteTask.bind(this);
        this.deleteList = this.deleteList.bind(this);
        this.setTasksSortingKey = this.setTasksSortingKey.bind(this);
        this.toggleShowCompletedTasks = this.toggleShowCompletedTasks.bind(this);
        this.addFilterTag = this.addFilterTag.bind(this);
        this.removeFilterTag = this.removeFilterTag.bind(this);
        this.resetCreateWith = this.resetCreateWith.bind(this);
        this.setDefaultListId = this.setDefaultListId.bind(this);
        this.renderMainView = this.renderMainView.bind(this);
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
                sendTask(localTask, taskList, taskList.remoteTasks[taskId]).then(success => {
                    this.setState(
                        immer.produce(draftState => {
                            draftState.taskLists[taskList.id].tasks[taskId].synced = success
                        })
                    )
                })
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
                                    users: remoteList.users,
                                    remoteTasks: remoteTasks
                                };
                            } else {
                                current.remoteTasks = remoteTasks;
                                current.users = remoteList.users;
                            }
                        }
                        const remoteIds = lists.map(t => t.id);
                        for (const [listId, taskList] of Object.entries(draftState.taskLists)) {
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
                const editedListId = String(taskList.id);
                if (!draftState.activeListIds.includes(editedListId)) {
                    draftState.activeListIds.push(editedListId);
                }
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

    async toggleShowCompletedTasks() {
        this.setState(prevState => {
            return {
                showCompletedTasks: !prevState.showCompletedTasks
            }
        }, this.storeUserSettings);
    }

    async addFilterTag(tag) {
        this.setState(prevState => {
            const nextFilterTags = Object.assign([], prevState.filterTags);
            if (!nextFilterTags.includes(tag)) {
                nextFilterTags.push(tag);
            }
            return {
                filterTags: nextFilterTags
            }
        }, this.storeUserSettings)
    }

    async setDefaultListId(listId) {
        this.setState({
            defaultListId: listId
        }, this.storeUserSettings);
    }

    async removeFilterTag(tag) {
        this.setState(prevState => {
            const nextFilterTags = Object.assign([], prevState.filterTags);
            nextFilterTags.removeIf(t => t === tag);
            return {
                filterTags: nextFilterTags
            }
        }, this.storeUserSettings)
    }

    deleteTask(taskId, taskListId) {
        return new Promise((res) => {
            this.setState(
                immer.produce(draftState => {
                    const listToUpdate = draftState.taskLists[taskListId];
                    delete listToUpdate.tasks[taskId];
                    for (const maybeRelatedTask of Object.values(listToUpdate.tasks)) {
                        maybeRelatedTask.dependingTasks.removeIf(tid => tid === taskId);
                        maybeRelatedTask.prerequisites.removeIf(tid => tid === taskId);
                    }
                }),
                async () => {
                    const success = await sendTaskDeletion(taskId, taskListId);
                    if (success) {
                        await this.writeUnsyncedLists;
                    }
                    res(success);
                }
            );
        });
    }

    deleteList(taskListId) {
        return new Promise((res) => {
            this.setState(
                immer.produce(draftState => {
                    delete draftState.taskLists[taskListId];
                }),
                async () => {
                    const success = await sendTaskListDeletion(taskListId);
                    if (success) {
                        await this.writeUnsyncedLists;
                    }
                    res(success);
                }
            );
        });
    }

    async setTasksSortingKey(sortingKey) {
        this.setState({
            tasksSortingKey: sortingKey
        }, this.storeUserSettings);
    }

    async storeUserSettings() {
        const activeListIds = [];
        for (const taskListId of Object.keys(this.state.taskLists)) {
            if (this.state.activeListIds.includes(taskListId)) {
                activeListIds.push(taskListId);
            }
        }
        const settings = {
            activeListIds: activeListIds,
            tasksSortingKey: this.state.tasksSortingKey,
            showCompletedTasks: this.state.showCompletedTasks,
            filterTags: this.state.filterTags,
            defaultListId: this.state.defaultListId,
        };
        const success = await sendSettings(settings);
        this.setState({
            settingsSynced: success
        });
        return success;
    }

    async fetchUserSettings() {
        const jsonResult = await getJson(API_URL_USERS + '/current');
        jsonResult.handle(
            currentUser => {
                if (currentUser !== null && currentUser.username !== null && currentUser.username !== undefined) {
                    this.setState({
                        loggedInUser: currentUser.username,
                        activeListIds: currentUser.settings?.activeListIds || [],
                        tasksSortingKey: currentUser.settings?.tasksSortingKey || SORT_KEY_DEFAULT,
                        showCompletedTasks: currentUser.settings?.showCompletedTasks || false,
                        filterTags: currentUser.settings?.filterTags || [],
                        defaultListId: currentUser.settings?.defaultListId,
                    }, this.fetchLists);
                }
            },
            errorMessage => {
                console.log(errorMessage);
            }
        );
    }

    async beforeUnload(event) {
        if (this.state.listsSynced && this.state.settingsSynced) {
            return null;
        }
        event.preventDefault();
        return event.returnValue = "There are unsaved changes. Are you sure?";
    }

    async componentDidMount() {
        window.addEventListener('online', this.updateOnlineStatus);
        window.addEventListener('offline', this.updateOnlineStatus);
        window.addEventListener('focus', this.writeAll);
        window.addEventListener("beforeunload", this.beforeUnload);
        const queryParams = new URLSearchParams(window.location.search);
        const createWithTitle = queryParams.get(QUERY_PARAM_CREATE);
        if (!isNull(createWithTitle) && createWithTitle.length > 0) {
            const initialTag = queryParams.get(QUERY_PARAM_TAG);
            this.setState({
                createWith: {
                    id: this.createTaskId(),
                    title: createWithTitle,
                    description: queryParams.get(QUERY_PARAM_DESCRIPTION) || "",
                    tags: isNull(initialTag) ? [] : [initialTag],
                }
            });
        }
        this.fetchUserSettings();
    }

    async componentWillUnmount() {
        window.removeEventListener('online', this.updateOnlineStatus);
        window.removeEventListener('offline', this.updateOnlineStatus);
        window.removeEventListener('focus', this.writeAll);
        window.removeEventListener("beforeunload", this.beforeUnload);
    }

    async componentDidUpdate() {
        let listsSynced = true;
        listsLoop:
            for (const [listId, taskList] of Object.entries(this.state.taskLists)) {
                if (!taskList.synced) {
                    listsSynced = false;
                    break;
                }
                for (const [taskId, task] of Object.entries(taskList.tasks)) {
                    if (!task.synced) {
                        listsSynced = false;
                        break listsLoop;
                    }
                }
            }

        if (this.state.listsSynced !== listsSynced) {
            this.setState({
                listsSynced: listsSynced
            });
        }
    }

    resetCreateWith() {
        return new Promise((res) => {
            this.setState({createWith: null},
                () => res()
            );
        });
    }

    renderMainView() {
        if (this.state.currentCategory === CATEGORY_ID_TASKS || !isNull(this.props.createWith)) {
            return e(
                TasksView,
                {
                    key: "tasksview",
                    taskLists: this.state.taskLists,
                    activeListIds: this.state.activeListIds,
                    onTaskUpdatedLocally: this.onTaskUpdatedLocally,
                    createTaskId: this.createTaskId,
                    sortingKey: this.state.tasksSortingKey,
                    setCurrentSortKey: this.setTasksSortingKey,
                    showCompletedTasks: this.state.showCompletedTasks,
                    toggleShowCompletedTasks: this.toggleShowCompletedTasks,
                    filterTags: this.state.filterTags,
                    addFilterTag: this.addFilterTag,
                    removeFilterTag: this.removeFilterTag,
                    createWith: this.state.createWith,
                    resetCreateWith: this.resetCreateWith,
                    deleteTask: this.deleteTask,
                    defaultListId: this.state.defaultListId,
                }
            );
        } else if (this.state.currentCategory === CATEGORY_ID_LISTS) {
            return e(
                ListsView,
                {
                    key: "listsview",
                    loggedInUser: this.state.loggedInUser,
                    taskLists: this.state.taskLists,
                    activeListIds: this.state.activeListIds,
                    setListActive: this.setListActive,
                    onListUpdatedLocally: this.onListUpdatedLocally,
                    createListId: this.createListId,
                    deleteList: this.deleteList,
                    defaultListId: this.state.defaultListId,
                    setDefaultListId: this.setDefaultListId,
                }
            );
        } else {
            return div(null, "Unexpected category: " + this.state.currentCategory);
        }
    }

    render() {
        if (this.state.loggedInUser === null) {
            return e(LoginForm, {onServerReply: this.onLoginReply, errorMessage: this.state.authorizationError});
        } else {
            return [
                e(NavBar, {
                    key: "navbar",
                    online: this.state.online,
                    synced: this.state.listsSynced && this.state.settingsSynced,
                    syncAction: this.writeAll,
                    currentCategory: this.state.currentCategory,
                    setCategory: cat => this.setState({
                        currentCategory: cat
                    })
                }),
                this.renderMainView()
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
