from sqlalchemy.exc import NoResultFound

from data_view import DataView
from flask import Flask, jsonify
from persistence import DB_URL_PROD, Persistence

API_BASE_URL = "/api/"
API_BASE_USERS = API_BASE_URL + "users/"
persistence = Persistence(DB_URL_PROD)
app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True


# FIXME implement login / session handling
me = persistence.get_user_by_name("edr")


@app.route(API_BASE_USERS)
def get_users():
    data_view = DataView(persistence, me)
    return jsonify(data_view.get_users(API_BASE_USERS))


@app.route(API_BASE_URL + "users/<int:user_id>")
def get_user(user_id: int):
    data_view = DataView(persistence, me)
    return jsonify(data_view.get_user(API_BASE_USERS, user_id))


@app.errorhandler(NoResultFound)
def handle_no_result_found (nrf):
    return 'not found!', 404


@app.teardown_appcontext
def shutdown_session(exception=None):
    persistence.session.remove()


if __name__ == '__main__':
    app.run()
