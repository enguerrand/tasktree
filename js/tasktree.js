class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedInUser: null,
            taskLists: {},
            online: true
        };
        this.createRequestId = this.createRequestId.bind(this);
        this.onLoginReply = this.onLoginReply.bind(this);
        this.fetchAll = this.fetchAll.bind(this);
        this.fetchLists = this.fetchLists.bind(this);
        this.onListUpdatedLocally = this.onListUpdatedLocally.bind(this);
        this.updateOnlineStatus = this.updateOnlineStatus.bind(this);
    }

    createRequestId() {
        const u = this.state.loggedInUser;
        if (isNull(u)) {
            throw Error("not logged in!");
        }
        return u + "." + String(Date.now());
    }

    async fetchLists() {
        const result = await getJson(API_URL_LISTS);
        result.handle(
            lists => {
                this.setState(
                    immer.produce(draftState => {
                        for (let taskListIndex = 0; taskListIndex < lists.length; taskListIndex++) {
                            const remoteList = lists[taskListIndex];
                            const current = draftState.taskLists[remoteList.requestId];
                            if (isNull(current) || current.synced) {
                                draftState.taskLists[remoteList.requestId] = {
                                    id: remoteList.id,
                                    title: remoteList.title,
                                    requestId: remoteList.requestId,
                                    synced: true
                                };
                            }
                        }
                        const remoteIds = lists.map(t => t.id);
                        for (const reqId in draftState.taskLists) {
                            if (!remoteIds.includes(draftState.taskLists[reqId].id)) {
                                delete draftState.taskLists[list.requestId];
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
                draftState.taskLists[taskList.requestId] = taskList;
            })
        );
    }

    async updateOnlineStatus() {
        const online = navigator.onLine;
        console.log("online state changed: " + String(online));
        this.setState({
            online: online
        })
        if (online) {
            this.fetchAll();
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
            return e(MainView, {
                lists: this.state.taskLists,
                onListUpdatedLocally: this.onListUpdatedLocally,
                createRequestId: this.createRequestId
            });
        }
    }
}

window.onload = function () {
    const domContainer = document.querySelector('#tasktree');
    ReactDOM.render(
        React.createElement(TaskTreeApp), domContainer
    );
}
