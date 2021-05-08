class MainView extends React.Component {
    // prop.lists
    // prop.onListAddedLocally(taskList)
    // prop.onListUpdatedLocally(taskList)
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
                onListAddedLocally: this.props.onListAddedLocally,
                onListUpdatedLocally: this.props.onListUpdatedLocally
            }
        );
    }
}