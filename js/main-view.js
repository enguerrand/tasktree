class MainView extends React.Component {
    // props.lists
    // props.category
    // props.onListUpdatedLocally(taskList)
    // props.createRequestId
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        if (this.props.category === CATEGORY_ID_LISTS) {
            return e(
                ListsView,
                {
                    lists: this.props.lists,
                    onListUpdatedLocally: this.props.onListUpdatedLocally,
                    createRequestId: this.props.createRequestId
                }
            );
        } else if (this.props.category === CATEGORY_ID_TASKS) {
            return div(null, "TASKS");
        } else {
            return div(null, "Unexpected category: " + this.props.category);
        }
    }
}