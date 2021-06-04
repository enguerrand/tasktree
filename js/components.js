class ModalDialog extends React.Component {
    // props.title
    // props.onCancel
    // props.onSubmit [optional]
    constructor(props) {
        super(props);
        this.handleGlassPaneClick = this.handleGlassPaneClick.bind(this);
    }

    handleGlassPaneClick(event) {
        if (event.target.id === "modal-glasspane") {
            this.props.onCancel();
        }
    }

    render() {
        let footer;
        if (isNull(this.props.onSubmit)) {
            footer = null;
        } else {
            footer = div({className: "modal-footer", key: "footer"},
                button({key: "cancel", className: "btn btn-secondary", onClick: this.props.onCancel}, S["label.cancel"]),
                button({key: "ok", className: "btn btn-primary", onClick: this.props.onSubmit}, S["label.save"])
            )
        }
        return (
            div({id: "modal-glasspane", className: "modal show", style: {display: "block"}, tabIndex: "-1", onClick: this.handleGlassPaneClick},
                div({className: "modal-dialog"},
                    div({className: "modal-content"},
                        div({className: "modal-header", key: "header"},
                            h5({className: "modal-title", key: "title"}, this.props.title),
                            button({className: "close", onClick: this.props.onCancel}, "x")
                        ),
                        div({className: "modal-body", key: "body"},
                            this.props.children
                        ),
                        footer
                    )
                )
            )
        );
    }
}
