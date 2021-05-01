class LoginForm extends React.Component {

    // props.onServerReply(sentUsername, loginSuccess)
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

    handleSubmit(event) {
        event.preventDefault();
        const username = this.state.username;
        postJson(BASE_URL + '/login', {
                'username': username,
                'password': this.state.password
        })
        .then(throwOnHttpError)
        .then((response) => {
            return response.json();
        }).then((reply) => {
            const success = reply.status === HTTP_STATUS_OK;
            console.log(JSON.stringify(reply));
            this.props.onServerReply(username, success);
        }).catch((error) => {
            console.log(error);
            this.props.onServerReply(username, false);
        });
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
                    button({className: "w-100 btn btn-lg btn-primary", type: "submit"},
                        "Sign in"
                    )
                )
            )
        );
    }
}