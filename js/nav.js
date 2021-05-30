class NavItem extends React.Component {
    // props.category
    // props.active
    // props.setCategory(category)
    constructor(props) {
        super(props);
    }

    render() {
        let className = "nav-item";
        if (this.props.active) {
            className += " active";
        }
        return (
            li(
                {
                    key: this.props.category,
                    className: className
                },
                a(
                    {
                        className: "nav-link",
                        onClick: () => this.props.setCategory(this.props.category)
                    },
                    S["nav.item." + this.props.category]
                )
            )
        );
    }
}

class NavBar extends React.Component {
    // props.online
    // props.synced
    // props.syncAction
    // props.currentCategory
    // props.setCategory(category)
    constructor(props) {
        super(props);
    }

    render() {
        const navItems = [];
        navItems.push(
            li(
                {
                    key: "logout",
                    className: "logout-button text-light"
                },
                i(
                    {
                        className: "mdi mdi-logout-variant mdi-flip-h",
                        onClick: logout
                    },
                    this.props.category
                )
            )
        );
        for (const category of [CATEGORY_ID_LISTS, CATEGORY_ID_TASKS]) {
            navItems.push(
                e(
                    NavItem,
                    {
                        key: category,
                        category: category,
                        active: (category === this.props.currentCategory),
                        setCategory: this.props.setCategory
                    }
                )
            );
        }
        let onlineIndicatorClass = "online-indicator";
        let onlineIndicatorIconName;
        if (this.props.online) {
            onlineIndicatorIconName = "lan-connect";
            if (this.props.synced) {
                onlineIndicatorClass += " text-success";
            } else {
                onlineIndicatorClass += " text-danger";
            }
        } else {
            onlineIndicatorIconName = "lan-disconnect";
            if (this.props.synced) {
                onlineIndicatorClass += " text-warning";
            } else {
                onlineIndicatorClass += " text-danger";
            }
        }
        return div({className: "row"},
            div({className: "col-12"},
                e('nav', { className: "navbar navbar-expand navbar-dark bg-dark"},
                    div({className: "collapse navbar-collapse"},
                        ul({className: "navbar-nav mr-auto mt-2 mt-lg-0"},
                            navItems
                        )
                    )
                ),
                div(
                    {
                        key: "online-indicator",
                        className: onlineIndicatorClass,
                        onClick: this.props.syncAction
                    },
                    i(
                        {
                            className: "mdi mdi-" + onlineIndicatorIconName
                        }
                    )
                )
            )
        )
    }

}