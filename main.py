import os

from dotenv import load_dotenv
from flask_login import LoginManager, current_user, login_required, login_user, logout_user
from sqlalchemy.exc import NoResultFound

from data_view import DataView, UserView
from flask import Flask, jsonify, request
from persistence import DB_URL_PROD, Persistence

load_dotenv()
API_BASE_URL = "/api/"
API_BASE_USERS = API_BASE_URL + "users/"

persistence = Persistence(DB_URL_PROD)
app = Flask(__name__)
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = True
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
# FIXME: apply https://flask.palletsprojects.com/en/1.1.x/security/

login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    try:
        return UserView(persistence.get_user(user_id), API_BASE_USERS)
    except NoResultFound:
        return None


@app.route("/login", methods=["GET", "POST"])
def login():
    username = request.args.get("username")
    password = request.args.get("password")
    authenticated_user = persistence.get_authenticated_user_by_name(username, password)
    if authenticated_user is not None:
        me = UserView(authenticated_user, API_BASE_USERS)
        login_user(me)
        return "success"
    else:
        return jsonify({"status": 401, "reason": "Username or Password Error"})


@app.route("/logout", methods=["GET", "POST"])
def logout():
    logout_user()
    return "you are logged out"


@app.route(API_BASE_USERS)
@login_required
def get_users():
    data_view = DataView(persistence, current_user)
    return jsonify(data_view.get_users(API_BASE_USERS))


@app.route(API_BASE_URL + "users/<int:user_id>")
@login_required
def get_user(user_id: int):
    data_view = DataView(persistence, current_user)
    return jsonify(data_view.get_user(API_BASE_USERS, user_id))


@app.errorhandler(NoResultFound)
def handle_no_result_found(nrf):
    return "not found!", 404


@app.teardown_appcontext
def shutdown_session(exception=None):
    persistence.session.remove()


if __name__ == "__main__":
    app.run()
