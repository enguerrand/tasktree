class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedInUser: null,
            listsLocal: {},
            listsRemote: {},
            online: true
        };
        this.onLoginReply = this.onLoginReply.bind(this);
        this.fetchAll = this.fetchAll.bind(this);
        this.fetchLists = this.fetchLists.bind(this);
        this.onListAdded = this.onListAdded.bind(this);
        this.onListUpdated = this.onListUpdated.bind(this);
        this.updateOnlineStatus = this.updateOnlineStatus.bind(this);
    }

    fetchLists() {
        getJson(API_URL_LISTS).then((lists) => {
            if (lists === null) {
                return;
            }
            this.setState((prevState, prevProps) => {
                let nextListsRemote = {};
                let nextListsLocal = {};

                for (const taskList of lists) {
                    nextListsRemote[taskList.id] = {
                        id: taskList.id,
                        title: taskList.title
                    }
                    const local = prevState.listsLocal[taskList.id];
                    if (isNull(local) || local.synced) {
                        nextListsLocal[taskList.id] = {
                            id: taskList.id,
                            title: taskList.title,
                            synced: true
                        };
                    }
                }
                for (const localTaskListId in prevState.listsLocal) {
                    const local = prevState.listsLocal[localTaskListId];
                    if (!isNull(local) && !local.synced) {
                        nextListsLocal[localTaskListId] = local;
                    } else if (!isNull(nextListsRemote[localTaskListId])) {
                        const nextLocal = nextListsRemote[localTaskListId];
                        nextListsLocal[localTaskListId] = {
                            id: localTaskListId,
                            title: nextLocal.title,
                            synced: true
                        };
                    }
                }
                return {
                    listsLocal: nextListsLocal,
                    listsRemote: nextListsRemote,
                };
            });
        }).catch((error) => {
            console.log(error);
        });
    }

    fetchAll() {
        this.fetchLists();
    }

    onLoginReply(sentUsername, authorizationSuccess) {
        if (authorizationSuccess) {
            this.setState({loggedInUser: sentUsername}, this.fetchAll);
        } else {
            this.setState({loggedInUser: null});
        }
    }

    onListAdded(taskList) {
        console.log("list added: " + JSON.stringify(taskList));
        this.fetchLists();
    }

    onListUpdated(taskList) {
        console.log("list updated: " + JSON.stringify(taskList));
        const synced = taskList.synced;
        this.setState((prevState, prevProps) => {
            const nextState = {
            }
            nextState.listsLocal = Object.assign({}, prevState.listsRemote);
            nextState.listsLocal[taskList.id] = taskList;
            if (synced) {
                nextState.listsRemote = Object.assign({}, prevState.listsRemote);
                nextState.listsRemote[taskList.id] = taskList;
            }
            return nextState;
        });
    }

    updateOnlineStatus() {
        const online = navigator.onLine;
        console.log("online state changed: " + String(online));
        this.setState({
            online: online
        })
        if (online) {
            this.fetchAll();
        }
    }

    componentDidMount() {
        window.addEventListener('online', this.updateOnlineStatus);
        window.addEventListener('offline', this.updateOnlineStatus);
        getJson(API_URL_USERS + '/current').then((currentUser) => {
            if (currentUser !== null && currentUser.username !== null && currentUser.username !== undefined) {
                this.setState({
                    loggedInUser: currentUser.username
                }, this.fetchAll);
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    render() {
        if (this.state.loggedInUser === null) {
            return e(LoginForm, {onServerReply: this.onLoginReply});
        } else {
            return e(MainView, {
                lists: this.state.listsLocal,
                listAdded: this.onListAdded,
                listUpdated: this.onListUpdated
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
