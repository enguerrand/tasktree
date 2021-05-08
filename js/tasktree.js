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
        this.onListAddedLocally = this.onListAddedLocally.bind(this);
        this.onListUpdatedLocally = this.onListUpdatedLocally.bind(this);
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
                    for (let taskListIndex = 0; taskListIndex < lists.length; taskListIndex++) {
                        const remoteList = lists[taskListIndex];
                        draftState.listsRemote.push({
                            id: remoteList.id,
                            title: remoteList.title
                        });
                        draftState.listsLocal.updateIf(l => l.synced && l.id === remoteList.id, l => l.title = remoteList.title);
                        if (draftState.listsLocal.noneMatch(l => l.id === remoteList.id)){
                            draftState.listsLocal.push({
                                id: remoteList.id,
                                title: remoteList.title,
                                synced: true
                            });
                        }
                    }
                    const remoteIds = draftState.listsRemote.map(t => t.id);
                    draftState.listsLocal.removeIf(l => l.synced && !remoteIds.includes(l.id));
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

    onListAddedLocally(taskList) {
        console.log("list added: " + JSON.stringify(taskList));
        this.setState(
            immer.produce(draftState => {
                draftState.listsLocal.push(taskList);
                if (taskList.synced) {
                    draftState.listsRemote.push(taskList);
                }
            }), this.fetchAll
        );
    }

    onListUpdatedLocally(taskList) {
        console.log("list updated: " + JSON.stringify(taskList));
        const synced = taskList.synced;
        this.setState(
            immer.produce(draftState => {
                draftState.listsLocal.updateIf(l => l.id === taskList.id, l => {
                    l.synced = synced;
                    l.title = taskList.title;
                });
                if (synced) {
                    draftState.listsRemote.updateIf(l => l.id === taskList.id, l => l.title = taskList.title);
                }
            }), this.fetchAll
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
                onListAddedLocally: this.onListAddedLocally,
                onListUpdatedLocally: this.onListUpdatedLocally
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
