class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedInUser: null,
            listsLocal: [],
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
                            draftState.listsLocal.updateIf(l => l.synced && l.id === remoteList.id, l => l.title = remoteList.title);
                            if (draftState.listsLocal.noneMatch(l => l.id === remoteList.id)){
                                draftState.listsLocal.push({
                                    id: remoteList.id,
                                    title: remoteList.title,
                                    requestId: remoteList.requestId,
                                    synced: true
                                });
                            }
                        }
                        const remoteIds = lists.map(t => t.id);
                        draftState.listsLocal.removeIf(l => l.synced && !remoteIds.includes(l.id));
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
                if (isNull(taskList.id)) {
                    draftState.listsLocal.push(taskList);
                } else {
                    draftState.listsLocal.updateIf(l => l.id === taskList.id, l => {
                        l.synced = synced;
                        l.title = taskList.title;
                    });
                }
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
                lists: this.state.listsLocal,
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
