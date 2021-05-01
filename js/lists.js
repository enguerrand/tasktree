class ListsView extends React.Component {
    // prop.lists
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        let rows = [];
        for (const listId in this.props.lists) {
            rows.push(
                tr({key: listId},
                    th({key: "id", scope: "row", className: "align-middle"}, listId),
                    td({key: "title", className: "align-middle"}, this.props.lists[listId].title),
                    td({key: "action", className: "right align-middle"}, button({className: "btn btn-primary"}, i({className: "mdi mdi-pencil-outline"})))
                )
            );
        }
        return table({className: "table table-striped table-dark"},
            thead({key: "head"},
                tr(null,
                    th({key: "id", scope: "col", className: "align-middle"}, "ID"),
                    th({key: "title", scope: "col", className: "align-middle"}, "TITLE"),
                    th({key: "action", scope: "col", className: "right align-middle"}, "")
                )
            ),
            tbody({key: "body"}, rows)
        )
    }
}
