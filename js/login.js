class LoginForm extends React.Component {
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

        let formData = new FormData();
        formData.append('username', this.state.username);
        formData.append('password', this.state.password);

        fetch('http://localhost:5000/login', {
            method: 'post',
// FIXME implement csrf
         // headers: {
//                        'X-CSRFToken': csrf,
//             },
            body: formData
        })
        .then((response) => {
            return response.json();
        }).then((reply) => {
            console.log(JSON.stringify(reply));
        }).catch((error) => {
            console.log(error);
        });

    }
    render() {
        return div(
            {className: "row"},
            div({className: "col-12"},
                form(
                    {onSubmit: this.handleSubmit},
                    h1({className: "h3 mb-3 fw-normal"},
                        "Login"
                    ),
                    div({className:"form-floating"},
                        input({type: "text", className: "form-control", id: "user-input", placeholder: "Username", value: this.state.username, onChange: this.handleUsernameChange}),
                        label({htmlFor: "user-input"}, "Username")
                    ),
                    div({className: "form-floating"},
                        input({type: "password", className: "form-control", id: "password-input", placeholder: "Password", value: this.state.password, onChange: this.handlePasswordChange}),
                        label({htmlFor: "password-input"}, "Password")
                    ),
                    button({className: "w-100 btn btn-lg btn-primary", type: "submit"},
                        "Sign in"
                    )
                )
            )
        );

    }
}