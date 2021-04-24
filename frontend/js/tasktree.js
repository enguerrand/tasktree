class TaskTreeApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        return div(
            null,
            "Hi!"
        )
    }
}

window.onload = function () {
    const domContainer = document.querySelector('#tasktree');
    ReactDOM.render(
        React.createElement(TaskTreeApp), domContainer
    );
}
