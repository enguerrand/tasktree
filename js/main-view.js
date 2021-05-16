class MainView extends React.Component {
    // props.taskLists
    // props.category
    // props.onListUpdatedLocally(taskList)
    // props.createListId
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        if (this.props.category === CATEGORY_ID_LISTS) {
            return e(
                ListsView,
                {
                    taskLists: this.props.taskLists,
                    onListUpdatedLocally: this.props.onListUpdatedLocally,
                    createListId: this.props.createListId
                }
            );
        } else if (this.props.category === CATEGORY_ID_TASKS) {
            return e(
                TasksView,
                {
                    taskLists: this.props.taskLists,
                    onListUpdatedLocally: this.props.onListUpdatedLocally,
                    createListId: this.props.createListId
                }
            );
        } else {
            return div(null, "Unexpected category: " + this.props.category);
        }
    }
}