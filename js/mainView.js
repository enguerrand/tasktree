class ListView extends React.Component {
    // prop.lists
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        let lists = [];
        for (const listId in this.props.lists) {
            lists.push(
                li(
                    {
                        key: listId
                    },
                    listId + " - " + this.props.lists[listId].title
                )
            );
        }
        return div(
            null,
            ul(
                null,
                lists
            )
        );
    }
}


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
            ListView,
            {
                lists: this.props.lists
            }
        );
    }
}