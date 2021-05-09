const BASE_URL = ''
const API_URL = BASE_URL + '/api';
const API_URL_USERS = API_URL + '/users';
const API_URL_LISTS = API_URL + '/lists';
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_NOT_AUTHORIZED = 401;
const CSRF_TOKEN = document.head.querySelector("[name=csrf-token][content]").content;
function throwOnHttpError(response){
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}

function getJson(url) {
    return fetch(url, {
        method: 'get',
        headers: {
            'X-CSRFToken': CSRF_TOKEN,
        },
    })
        .then(throwOnHttpError)
        .then((response) => {
            return response.json();
        })
}

function postJson(url, json) {
    return fetch(url, {
        method: 'post',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'X-CSRFToken': CSRF_TOKEN,
        },
        body: JSON.stringify(json)
    })
}

function postTaskList(taskList) {
    let listId;
    if (isNull(taskList.id)) {
        listId = "";
    } else {
        listId = taskList.id;
    }
    return postJson(API_URL_LISTS + '/' + listId, {
        'title': taskList.title
    }).then(response => {
        return response.ok;
    }).catch(() => {
        return false;
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