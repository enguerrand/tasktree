class MainView extends React.Component {
    // prop.lists
    // prop.listAdded(taskList)
    // prop.listUpdated(taskList)
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
                listAdded: this.props.listAdded,
                listUpdated: this.props.listUpdated
            }
        );
    }
}