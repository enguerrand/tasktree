import os

from dotenv import load_dotenv
from flask_login import LoginManager, current_user, login_required, login_user, logout_user
from flask_talisman import Talisman
from flask_wtf import CSRFProtect
from sqlalchemy.exc import NoResultFound

from data_view import DataView, UserView
from flask import Flask, Response, jsonify, render_template, request, send_from_directory
from persistence import DB_URL_PROD, Persistence

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
API_BASE_URL = "/api/"
API_BASE_USERS = API_BASE_URL + "users/"
API_BASE_LISTS = API_BASE_URL + "lists/"

persistence = Persistence(DB_URL_PROD)
app = Flask(__name__)
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = True
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Strict',
)
CSRFProtect(app)
Talisman(app)

login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    try:
        return UserView(persistence.get_user(user_id))
    except NoResultFound:
        return None


@app.route("/login", methods=["GET", "POST"])
def login():
    username = request.json["username"]
    password = request.json["password"]
    authenticated_user = persistence.get_authenticated_user_by_name(username, password)
    if authenticated_user is not None:
        me = UserView(authenticated_user)
        login_user(me)
        return jsonify({"status": 200})
    else:
        return jsonify({"status": 401, "reason": "Username or Password Error"})


@app.route("/logout", methods=["GET", "POST"])
def logout():
    logout_user()
    return "you are logged out"


@app.route(API_BASE_USERS + "current", methods=["GET"])
@login_required
def logged_in_user():
    return {
        "id": current_user.id,
        "username": current_user.username,
    }


@app.route(API_BASE_LISTS)
@login_required
def get_lists():
    data_view = DataView(persistence, current_user)
    return jsonify(data_view.get_lists())


@app.route(API_BASE_LISTS + "<int:task_list_id>", methods=["PUT"])
@login_required
def write_task_list(task_list_id: int):
    data_view = DataView(persistence, current_user)
    data_view.create_or_replace_list(task_list_id, request.json)
    return success()


@app.route(API_BASE_LISTS + "<int:task_list_id>/<int:task_id>", methods=["PUT"])
@login_required
def write_task(task_list_id: int, task_id: int):
    data_view = DataView(persistence, current_user)
    data_view.create_or_update_task(task_list_id, task_id, request.json)
    return success()


@app.route(API_BASE_LISTS + "<int:task_list_id>/")
@login_required
def get_task_list(task_list_id: int):
    data_view = DataView(persistence, current_user)
    return jsonify(data_view.get_task_list(task_list_id))


@app.route(API_BASE_USERS)
@login_required
def get_users():
    data_view = DataView(persistence, current_user)
    return jsonify(data_view.get_users())


@app.route(API_BASE_URL + "users/<int:user_id>")
@login_required
def get_user(user_id: int):
    data_view = DataView(persistence, current_user)
    return jsonify(data_view.get_user(user_id))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/css/style.css")
def css():
    return Response(render_template("css/style.css"), mimetype="text/css")


@app.route("/js/<path:path>")
def serve_js(path):
    return send_from_directory("js", path)


@app.route("/assets/<path:path>")
def serve_assets(path):
    return send_from_directory("assets", path)


@app.errorhandler(NoResultFound)
def handle_no_result_found(nrf):
    return "not found!", 404


@app.errorhandler(PermissionError)
def handle_no_result_found(perm_error):
    return "unauthorized!", 401


@app.teardown_appcontext
def shutdown_session(exception=None):
    persistence.session.remove()


def success():
    return jsonify({"status": "success"})


if __name__ == "__main__":
    app.run()
