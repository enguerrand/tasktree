const BASE_URL = window.location.protocol + "//" + window.location.host;
const API_URL = BASE_URL + '/api';
const API_URL_USERS = API_URL + '/users';
const API_URL_LISTS = API_URL + '/lists';
const API_URL_ICS = API_URL + '/ics';
const API_URL_WEBCAL = API_URL + '/webcal';
const API_URL_CSRF = API_URL + '/csrf';
const CATEGORY_ID_LISTS = "lists";
const CATEGORY_ID_TASKS = "tasks";
const MIN_AUTO_FULL_SYNC_INTERVAL_MS = 1000 * 60 * 5;
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_NOT_AUTHORIZED = 401;
const LOCALE = navigator.language
const SORT_KEY_NEWEST = "newest";
const SORT_KEY_OLDEST = "oldest";
const SORT_KEY_DUE = "due";
const SORT_KEY_DEPENDENCIES = "dependencies";
const SORT_KEY_TITLE = "title";
const SORT_KEY_DEFAULT = SORT_KEY_NEWEST;
const QUERY_PARAM_CREATE = "create";
const QUERY_PARAM_DESCRIPTION = "description";
const QUERY_PARAM_TAG = "tag";
let csrf_token = document.head.querySelector("[name=csrf-token][content]").content;

class JsonResult {
    constructor(success, payload) {
        if (isNull(payload)) {
            this.success = false;
            this.payload = "Result is null";
        } else {
            this.payload = payload;
            this.success = success;
        }
    }
    // onSuccess(requestedValue)
    // onError(message)
    handle(onSuccess, onError) {
        if (this.success) {
            onSuccess(this.payload);
        } else {
            onError(this.payload);
        }
    }
}

// returns JsonResult
async function getJson(url) {
    try {
        const response = await fetch(url, {
            method: 'get'
        });
        if (!response.ok) {
            return new JsonResult(false, response.statusText);
        }
        const json = await response.json();
        return new JsonResult(true, json);
    } catch (e) {
        return new JsonResult(false, e.toString())
    }
}

// returns success true/false
async function sendJson(url, method, json) {
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'X-CSRFToken': csrf_token,
            },
            body: JSON.stringify(json)
        });
        if (response.status === 419) {
            renewCsrf();
        }
        return response.ok;
    } catch (e) {
        return false;
    }
}

function renewCsrf() {
    console.log("Attempting to renew outdated csrf token.")
    getJson(API_URL_CSRF).then(response => {
        const token = response?.payload?.token;
        if (!isNull(token)) {
            csrf_token = token;
            console.log("Token renewed!")
        } else {
            console.error("No token received!")
        }
    });
}

async function logout() {
    return getJson(BASE_URL + "/logout").then(() => location.reload());
}

async function sendSettings(settingsJson) {
    return sendJson(API_URL_USERS + "/current/settings", "put", settingsJson);
}

// todo: detect permission error and create new random id?
async function sendTaskList(taskList) {
    return sendJson(API_URL_LISTS + '/' + taskList.id, 'put', {
        'title': taskList.title,
        'users': taskList.users,
    });
}

async function sendTask(task, taskList, prevTask) {
    const json = {};
    json["next"] = {
        title: task.title,
        description: task.description,
        due: task.due,
        tags: task.tags,
        prerequisites: task.prerequisites,
        dependingTasks: task.dependingTasks,
        completed: task.completed,
    }
    if (!isNull(prevTask)) {
        json["prev"] = {
            title: prevTask.title,
            description: prevTask.description,
            due: prevTask.due,
            tags: prevTask.tags,
            prerequisites: prevTask.prerequisites,
            dependingTasks: prevTask.dependingTasks,
            completed: prevTask.completed,
        }
    }
    return sendJson(API_URL_LISTS + '/' + taskList.id + '/' + task.id, 'put', json);
}

async function sendTaskDeletion(taskId, taskListId) {
    return sendJson(API_URL_LISTS + '/' + taskListId + '/' + taskId, 'delete', {});
}

async function sendTaskListDeletion(taskListId) {
    return sendJson(API_URL_LISTS + '/' + taskListId, 'delete', {});
}

function cleanupUrl() {
    if (window.location.href === BASE_URL || window.location.href === BASE_URL + "/"){
        return;
    }
    window.history.pushState({}, document.title, BASE_URL);
}

function isNull(obj) {
    return obj === undefined || obj === null;
}

function deepCopy(source) {
    return JSON.parse(JSON.stringify(source));
}

function hasConflicts(task) {
    return !isNull(task.conflictingTitle) || !isNull(task.conflictingDescription);
}

function nowUtc() {
    let now = new Date();
    return toUtcTimeStamp(now);
}

function fromUtcTimeStamp(timestamp) {
    let localDate = new Date(timestamp);
    return new Date(localDate.getTime() - localDate.getTimezoneOffset()*60*1000);
}

function toUtcTimeStamp(date) {
    return date.getTime() + date.getTimezoneOffset()*60*1000;
}

function isValidDate(date) {
    return date instanceof Date && !isNaN(date);
}

function formatDate(timestampUtc) {
    const dateUtc = new Date(timestampUtc);
    return new Date(dateUtc.getTime() - dateUtc.getTimezoneOffset()*60*1000).toLocaleDateString(LOCALE);
}

function formatDateTime(timestampUtc) {
    const dateUtc = new Date(timestampUtc);
    return new Date(dateUtc.getTime() - dateUtc.getTimezoneOffset()*60*1000).toLocaleString(LOCALE);
}

function formatForHtmlInput(utcDate) {
    if (isNull(utcDate)) {
        return undefined;
    }
    try {
        const dueDate = new Date(fromUtcTimeStamp(utcDate));
        const year = dueDate.getFullYear();
        const month = padDateField(dueDate.getMonth() + 1);
        const day = padDateField(dueDate.getDate());
        const hours = padDateField(dueDate.getHours());
        const minutes = padDateField(dueDate.getMinutes());

        return year + "-" + month + "-" + day + "T" + hours + ":" + minutes;
    } catch (e) {
        return undefined;
    }
}

function padDateField(value) {
    if (value >= 10) {
        return value;
    } else {
        return "0" + value;
    }
}

function findUrls(input) {
    const re = /https?:\/\/[^\s$.?#].[^\s]*/g;
    const urls = [];
    let m;
    do {
        m = re.exec(input);
        if (m) {
            const url = m[0];
            console.log(m[0]);
            if (!urls.includes(url)) {
                urls.push(url);
            }
        }
    } while (m);
    return urls;
}

Array.prototype.removeIf = function(predicate) {
    let i = this.length;
    while (i--) {
        if (predicate(this[i], i)) {
            this.splice(i, 1);
        }
    }
};

Array.prototype.updateIf = function(predicate, updateFn) {
    for (let i=0; i<this.length; i++) {
        if (predicate(this[i])) {
            updateFn(this[i]);
        }
    }
};

Array.prototype.anyMatch = function(predicate) {
    for (let i=0; i<this.length; i++) {
        if (predicate(this[i])) {
            return true;
        }
    }
    return false;
}

Array.prototype.noneMatch = function(predicate) {
    return !this.anyMatch(predicate);
}

Array.prototype.equals = function arrayEquals(other) {
    return Array.isArray(other) &&
        this.length === other.length &&
        this.every((val, index) => val === other[index]);
}