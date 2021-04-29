class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedInUser: null,
            listsLocal: {},
            listsRemote: {},
        };
        this.onLoginReply = this.onLoginReply.bind(this);
        this.fetchAll = this.fetchAll.bind(this);
    }

    fetchAll() {
        getJson(API_URL_LISTS).then((lists) => {
            if (lists === null) {
                return;
            }
            this.setState((prevState, prevProps) => {
                let nextListsRemote = {};
                let nextListsLocal = {};

                for (const taskList of lists) {
                    nextListsRemote[taskList.id] = {
                        title: taskList.title
                    }
                    const local = prevState.listsLocal[taskList.id];
                    if (isNull(local) || local.synced) {
                        nextListsLocal[taskList.id] = {
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
                            title: nextLocal.title,
                            synced: true
                        };
                    }
                }
                return {
                    listsLocal: nextListsLocal,
                    listsRemote: nextListsRemote,
                }
            });
        }).catch((error) => {
            console.log(error);
        });
    }

    onLoginReply(sentUsername, authorizationSuccess) {
        if (authorizationSuccess) {
            this.setState({loggedInUser: sentUsername}, this.fetchAll);
        } else {
            this.setState({loggedInUser: null});
        }
    }

    componentDidMount() {
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
            return e(MainView, {lists: this.state.listsLocal});
        }
    }
}

window.onload = function () {
    const domContainer = document.querySelector('#tasktree');
    ReactDOM.render(
        React.createElement(TaskTreeApp), domContainer
    );
}
