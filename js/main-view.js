class MainView extends React.Component {
    // props.loggedInUser
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
    // props.filterTags
    // props.addFilterTag(tag)
    // props.removeFilterTag(tag)
    // props.createWithTitle
    // props.resetCreateWithTitle
    // props.deleteTask(taskId, taskListId)
    // props.deleteList(taskListId)
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        if (this.props.category === CATEGORY_ID_TASKS || !isNull(this.props.createWithTitle)) {
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
                    filterTags: this.props.filterTags,
                    addFilterTag: this.props.addFilterTag,
                    removeFilterTag: this.props.removeFilterTag,
                    createWithTitle: this.props.createWithTitle,
                    resetCreateWithTitle: this.props.resetCreateWithTitle,
                    deleteTask: this.props.deleteTask,
                }
            );
        } else if (this.props.category === CATEGORY_ID_LISTS) {
            return e(
                ListsView,
                {
                    loggedInUser: this.props.loggedInUser,
                    taskLists: this.props.taskLists,
                    activeListIds: this.props.activeListIds,
                    setListActive: this.props.setListActive,
                    onListUpdatedLocally: this.props.onListUpdatedLocally,
                    createListId: this.props.createListId,
                    deleteList: this.props.deleteList,
                }
            );
        } else {
            return div(null, "Unexpected category: " + this.props.category);
        }
    }
}