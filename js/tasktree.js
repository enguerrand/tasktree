class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedInUser: null,
            listsLocal: [],
            listsRemote: [],
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
            this.setState(
                immer.produce(draftState => {
                    draftState.listsRemote = [];

                    for (const taskListIndex in lists) {
                        const remoteList = lists[taskListIndex];
                        draftState.listsRemote.push({
                            id: remoteList.id,
                            title: remoteList.title
                        });
                        let foundLocally = false;
                        for (const localIndex in draftState.listsLocal) {
                            const localList = draftState.listsLocal[localIndex];
                            if (localList.id === remoteList.id) {
                                draftState.listsLocal[localIndex].title = remoteList.title;
                                foundLocally = true;
                                break;
                            }
                        }
                        if (!foundLocally) {
                            draftState.listsLocal.push({
                                id: remoteList.id,
                                title: remoteList.title,
                                synced: true
                            });
                        }
                    }
                    const remoteIds = draftState.listsRemote.map(t => t.id);
                    for (const localTaskListIndex in draftState.listsLocal) {
                        const localList = draftState.listsLocal[localTaskListIndex];
                        if (localList.synced && !remoteIds.includes(localList.id)) {
                            delete draftState.listsLocal[localTaskListIndex];
                        }
                    }
                })
            );
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
        this.setState(
            immer.produce(draftState => {
                draftState.listsLocal.push(taskList);
                if (taskList.synced) {
                    draftState.listsRemote.push(taskList);
                }
            })
        );
    }

    onListUpdated(taskList) {
        console.log("list updated: " + JSON.stringify(taskList));
        const synced = taskList.synced;
        this.setState(
            immer.produce(draftState => {
                for (const localIndex in draftState.listsLocal) {
                    const localList = draftState.listsLocal[localIndex];
                    if (localList.id === taskList.id) {
                        draftState.listsLocal[localIndex] = taskList;
                        break;
                    }
                }
                if (synced) {
                    for (const remoteIndex in draftState.listsRemote) {
                        const remoteList = draftState.listsRemote[remoteIndex];
                        if (remoteList.id === taskList.id) {
                            draftState.listsRemote[remoteIndex] = taskList;
                            break;
                        }
                    }
                }
            })
        );
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
