class MainView extends React.Component {
    // prop.lists
    constructor(props) {
        super(props);
        this.state = {
            viewStack: []
        };
    }

    render() {
        return e(
            ListsView,
            {
                lists: this.props.lists
            }
        );
    }
}