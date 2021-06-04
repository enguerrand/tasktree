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
                    div({className: "modal-content bg-dark text-light"},
                        div({className: "modal-header", key: "header"},
                            h5({className: "modal-title", key: "title"}, this.props.title),
                            button({className: "close text-light", onClick: this.props.onCancel}, "x")
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

class RadioList extends React.Component {
    // props.handleSelection(selectedOptionId)
    // props.availableOptions  --> each option has property id and label
    constructor(props) {
        super(props);
        this.handleTextInput = this.handleTextInput.bind(this);
        this.state = {
            currentFilterInput: ""
        };
    }


    handleTextInput(event) {
        this.setState({currentFilterInput: event.target.value});
    }

    render() {
        const optionsList = [];
        let optionIndex = 0;
        for (const option of this.props.availableOptions) {
            if (option.label.includes(this.state.currentFilterInput)) {
                const optionClassSuffix = optionIndex % 2 === 0 ? "secondary" : "dark";

                optionsList.push(
                    div({
                            key: option.id,
                            className: "list-group-item list-group-item-action list-group-item-"+optionClassSuffix,
                            onClick: () => this.props.handleSelection(option.id)
                        },
                        option.label
                    )
                );
                optionIndex++;
            }
        }
        return (
            div({className: "radio-list"},
                div({key: "filter", className: "radio-list-filter-input"},
                    input({
                        className: "form-control",
                        type: "text",
                        autoComplete: "false",
                        placeholder: S["radio.list.filter.hint"],
                        value: this.state.currentFilterInput,
                        onChange: this.handleTextInput
                    })
                ),
                ul({key: "list", className: "list-group mt-2 radio-list-options"},
                    optionsList
                )
            )
        );
    }



}