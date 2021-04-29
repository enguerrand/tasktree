class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedInUser: null
        };
        this.onLoginReply = this.onLoginReply.bind(this);
    }

    onLoginReply(sentUsername, authorizationSuccess) {
        if (authorizationSuccess) {
            this.setState({loggedInUser: sentUsername});
        } else {
            this.setState({loggedInUser: null});
        }
    }

    componentDidMount() {
        getJson(API_URL_USERS + '/current').then((currentUser) => {
            if (currentUser !== null && currentUser.username !== null && currentUser.username !== undefined) {
                this.setState({
                    loggedInUser: currentUser.username
                });
            }
        }).catch((error) => {
            console.log(error);
        });
    }

    render() {
        if (this.state.loggedInUser === null) {
            return e(LoginForm, {onServerReply: this.onLoginReply});
        } else {
            return e(MainView);
        }
    }
}

window.onload = function () {
    const domContainer = document.querySelector('#tasktree');
    ReactDOM.render(
        React.createElement(TaskTreeApp), domContainer
    );
}
