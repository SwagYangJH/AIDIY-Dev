from flask import Flask, render_template, request, redirect, session, jsonify
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'

CLIENT_ID = "237672950587-0fjv71akur45kfao2gf7anggc0ft1fit.apps.googleusercontent.com"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_user')
def get_user():
    return jsonify({
        "email": session.get("email"),
        "name": session.get("name")
    })

@app.route('/success')
def success():
    return render_template('success.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

@app.route('/login', methods=['POST'])
def login():
    credential = request.form.get('credential')
    print(f"Google credential received: {credential}")
    try:
        idinfo = id_token.verify_oauth2_token(credential, google_requests.Request(), CLIENT_ID)
        session['email'] = idinfo.get('email')
        session['name'] = idinfo.get('name')
        return redirect('/success')
    except Exception as e:
        print(f"Token verification failed: {e}")
        return 'Login failed', 400

if __name__ == '__main__':
    app.run(host="localhost", port=3000, debug=True)
