const BASE_URL = ''
const API_URL = BASE_URL + '/api';
const API_URL_USERS = API_URL + '/users';
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_NOT_AUTHORIZED = 401;
const CSRF_TOKEN = document.head.querySelector("[name=csrf-token][content]").content;
function throwOnHttpError(response){
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}