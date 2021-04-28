class MainView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            viewStack: []
        };
    }

    render() {
        return p(null, "This is the main view");
    }
}