const BASE_URL = ''
const API_URL = BASE_URL + '/api';
const API_URL_USERS = API_URL + '/users';
const API_URL_LISTS = API_URL + '/lists';
const CATEGORY_ID_LISTS = "LISTS";
const CATEGORY_ID_TASKS = "TASKS";
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_NOT_AUTHORIZED = 401;
const CSRF_TOKEN = document.head.querySelector("[name=csrf-token][content]").content;

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
            method: 'get',
            headers: {
                'X-CSRFToken': CSRF_TOKEN,
            },
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
                'X-CSRFToken': CSRF_TOKEN,
            },
            body: JSON.stringify(json)
        });
        return response.ok;
    } catch (e) {
        return false;
    }
}

// todo: detect permission error and create new random id?
async function sendTaskList(taskList) {
    let listId;
    if (isNull(taskList.id)) {
        listId = "";
    } else {
        listId = taskList.id;
    }
    return sendJson(API_URL_LISTS + '/' + listId, 'put', {
        'title': taskList.title,
        'requestId': taskList.requestId
    });
}

function isNull(obj) {
    return obj === undefined || obj === null;
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