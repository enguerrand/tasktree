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
                    this.props.category
                )
            )
        );
    }
}

class NavBar extends React.Component {
    // props.currentCategory
    // props.setCategory(category)
    constructor(props) {
        super(props);
    }

    render() {
        const navItems = [];
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
        return div({className: "row"},
            div({className: "col-12"},
                e('nav', { className: "navbar navbar-expand-lg navbar-dark bg-dark"},
                    div({className: "collapse navbar-collapse"},
                        ul({className: "navbar-nav mr-auto mt-2 mt-lg-0"},
                            navItems
                        )
                    )
                )
            )
        )
    }

}