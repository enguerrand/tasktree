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
