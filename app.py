import string
import random
from flask import *
import sqlite3

web_app = Flask(__name__)
web_app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

def connect_database():
    connection = getattr(g, '_database_connection', None)
    if connection is None:
        connection = g._database_connection = sqlite3.connect('db/messaging_app.sqlite3')
        connection.row_factory = sqlite3.Row
    return connection

@web_app.teardown_appcontext
def close_db_connection(exception):
    connection = getattr(g, '_database_connection', None)
    if connection is not None:
        connection.close()

def execute_db_query(sql_query, parameters=(), single_result=False):
    connection = connect_database()
    cur = connection.execute(sql_query, parameters)
    results = cur.fetchall()
    connection.commit()
    cur.close()
    return results[0] if single_result and results else results

def authenticate_user(request):
    user_identifier = request.cookies.get('member_id')
    secret = request.cookies.get('member_secret')
    if user_identifier and secret:
        return execute_db_query('SELECT * FROM members WHERE member_id = ? AND user_password = ?', 
                                [user_identifier, secret], single_result=True)
    return None

@web_app.route('/api/membership', methods=['POST'])
def register():
    member_info = create_member()
    response = make_response(jsonify({'id': member_info['member_id'], 'username': member_info['username'], 'token': member_info['access_key']}), 200)
    response.set_cookie('member_id', str(member_info['member_id']))
    response.set_cookie('member_secret', member_info['user_password'])
    return response

@web_app.route('/api/access', methods=['POST'])
def access():
    credentials = request.get_json()
    member_name = credentials.get('username')
    member_password = credentials.get('password')
    
    if execute_db_query('SELECT * FROM members WHERE username = ? AND user_password = ?', 
                        [member_name, member_password], single_result=True):
        return jsonify({'status': 'success'})
    else:
        return jsonify({'error': 'Login failed'}), 401

@web_app.route('/api/update-name', methods=['PUT'])
def modify_username():
    member = authenticate_user(request)
    if not member:
        return jsonify({'error': 'Access denied'}), 401
    
    updated_name = request.json.get('new_username')
    execute_db_query('UPDATE members SET username = ? WHERE member_id = ?', 
                     [updated_name, member['member_id']])
    return jsonify({'status': 'success'})

@web_app.route('/api/update-secret', methods=['PUT'])
def modify_password():
    member = authenticate_user(request)
    if not member:
        return jsonify({'error': 'Access denied'}), 401
    
    updated_secret = request.json.get('new_password')
    execute_db_query('UPDATE members SET user_password = ? WHERE member_id = ?', 
                     [updated_secret, member['member_id']])
    return jsonify({'status': 'success'})

@web_app.route('/')
@web_app.route('/login')
@web_app.route('/space')
@web_app.route('/space/<channel_id>')
def serve_main_page():
    return web_app.send_static_file('index.html')

@web_app.route('/api/notifications')
def fetch_unread_counts():
    unread_counts_example = {1: 0, 2: 5, 3: 2}
    return jsonify(unread_counts_example)

def create_member():
    unique_name = "Guest#" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    generated_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    member_record = execute_db_query(
        'INSERT INTO members (username, user_password, access_key) VALUES (?, ?, ?) RETURNING member_id, username, user_password, access_key',
        (unique_name, generated_password, token), single_result=True)
    return member_record

if __name__ == '__main__':
    web_app.run(debug=True)
