class MainView extends React.Component {
    // props.taskLists
    // props.activeListIds
    // props.setListActive(id, active)
    // props.category
    // props.onListUpdatedLocally(taskList)
    // props.onTaskUpdatedLocally(task, taskList)
    // props.createListId
    // props.tasksSortingKey
    // props.setCurrentSortingKey(sortKey)
    // props.onTaskUpdatedLocally(task, taskList)
    // props.showCompletedTasks
    // props.toggleShowCompletedTasks
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        if (this.props.category === CATEGORY_ID_LISTS) {
            return e(
                ListsView,
                {
                    taskLists: this.props.taskLists,
                    activeListIds: this.props.activeListIds,
                    setListActive: this.props.setListActive,
                    onListUpdatedLocally: this.props.onListUpdatedLocally,
                    createListId: this.props.createListId
                }
            );
        } else if (this.props.category === CATEGORY_ID_TASKS) {
            return e(
                TasksView,
                {
                    taskLists: this.props.taskLists,
                    activeListIds: this.props.activeListIds,
                    onTaskUpdatedLocally: this.props.onTaskUpdatedLocally,
                    createTaskId: this.props.createTaskId,
                    sortingKey: this.props.tasksSortingKey,
                    setCurrentSortKey: this.props.setCurrentSortKey,
                    showCompletedTasks: this.props.showCompletedTasks,
                    toggleShowCompletedTasks: this.props.toggleShowCompletedTasks,
                }
            );
        } else {
            return div(null, "Unexpected category: " + this.props.category);
        }
    }
}