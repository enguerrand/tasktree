class MainView extends React.Component {
    // props.lists
    // props.onListUpdatedLocally(taskList)
    // props.createRequestId
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        return e(
            ListsView,
            {
                lists: this.props.lists,
                onListUpdatedLocally: this.props.onListUpdatedLocally,
                createRequestId: this.props.createRequestId
            }
        );
    }
}