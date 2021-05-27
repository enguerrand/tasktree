class LoginForm extends React.Component {

    // props.onServerReply(sentUsername, loginSuccess)
    // props.errorMessage
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: ""
        };
        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleUsernameChange(event) {
        this.setState({username: event.target.value});
    }

    handlePasswordChange(event) {
        this.setState({password: event.target.value});
    }

    async handleSubmit(event) {
        event.preventDefault();
        const username = this.state.username;
        const success = await sendJson(BASE_URL + '/login', 'post', {
                'username': username,
                'password': this.state.password
        })
        this.props.onServerReply(username, success);
    }

    render() {

        return div(
            {className: "row"},
            div({className: "col-12"},
                form(
                    {onSubmit: this.handleSubmit},
                    h1({className: "h3 mb-3 fw-normal text-light"},
                        "Login"
                    ),
                    div({className:"form-floating"},
                        input({type: "text", className: "form-control", id: "user-input", placeholder: "Username", value: this.state.username, onChange: this.handleUsernameChange}),
                        label({htmlFor: "user-input", className: "text-light"}, "Username")
                    ),
                    div({className: "form-floating"},
                        input({type: "password", className: "form-control", id: "password-input", placeholder: "Password", value: this.state.password, onChange: this.handlePasswordChange}),
                        label({htmlFor: "password-input", className: "text-light"}, "Password")
                    ),
                    div({className: "login-form-error-message text-danger" },
                        this.props.errorMessage
                    ),
                    button({className: "w-100 btn btn-lg btn-primary", type: "submit"},
                        "Sign in"
                    )
                )
            )
        );
    }
}