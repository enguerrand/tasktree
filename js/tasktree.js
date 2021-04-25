class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        return e(LoginForm);
    }
}

window.onload = function () {
    const domContainer = document.querySelector('#tasktree');
    ReactDOM.render(
        React.createElement(TaskTreeApp), domContainer
    );
}
