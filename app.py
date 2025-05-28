from flask import Flask, request, jsonify, session
from flask_cors import CORS
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import jwt
from datetime import datetime, timedelta
import json
import random
import string

app = Flask(__name__)
app.secret_key = 'your_super_secret_key_change_this_in_production'

# Enable CORS for React frontend
CORS(app, origins=['http://localhost:3000'], supports_credentials=True)

CLIENT_ID = "237672950587-0fjv71akur45kfao2gf7anggc0ft1fit.apps.googleusercontent.com"
JWT_SECRET = 'your_jwt_secret_key_change_this_in_production'

# Mock database (in production, use real database)
users_db = {}
children_db = {}
otp_store = {}  # Store OTPs temporarily

def generate_jwt_token(user_data):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_data['email'],
        'name': user_data['name'],
        'email': user_data['email'],
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_jwt_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'AIDIY Flask Server is running!',
        'timestamp': datetime.utcnow().isoformat()
    })

# Google OAuth login
@app.route('/auth/google', methods=['POST'])
def google_login():
    try:
        data = request.get_json()
        credential = data.get('token')
        
        if not credential:
            return jsonify({'error': 'No token provided'}), 400
        
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            credential, google_requests.Request(), CLIENT_ID
        )
        
        user_data = {
            'email': idinfo.get('email'),
            'name': idinfo.get('name'),
            'picture': idinfo.get('picture'),
            'google_id': idinfo.get('sub')
        }
        
        # Store user in mock database
        users_db[user_data['email']] = user_data
        
        # Generate JWT token
        app_token = generate_jwt_token(user_data)
        
        return jsonify({
            'success': True,
            'user': user_data,
            'appToken': app_token
        })
        
    except Exception as e:
        print(f"Google login error: {e}")
        return jsonify({'error': 'Authentication failed'}), 400

# Email/Password login
@app.route('/api/auth/login', methods=['POST'])
def email_login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        # Mock authentication (in production, verify against database)
        if email and password:
            user_data = {
                'email': email,
                'name': email.split('@')[0],
                'picture': None,
                'login_type': 'email'
            }
            
            users_db[email] = user_data
            app_token = generate_jwt_token(user_data)
            
            return jsonify({
                'success': True,
                'user': user_data,
                'appToken': app_token
            })
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        print(f"Email login error: {e}")
        return jsonify({'error': 'Login failed'}), 400

# Register new user
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        email = data.get('email')
        phone_number = data.get('phoneNumber')
        password = data.get('password')
        
        # Check if user already exists
        if email in users_db:
            return jsonify({'error': 'User already exists'}), 400
        
        # Create new user (in production, hash password and save to database)
        user_data = {
            'email': email,
            'firstName': first_name,
            'lastName': last_name,
            'name': f"{first_name} {last_name}",
            'phoneNumber': phone_number,
            'password': password,  # In production, hash this!
            'verified': False,
            'picture': None,
            'login_type': 'email'
        }
        
        users_db[email] = user_data
        
        return jsonify({
            'success': True,
            'message': 'Registration successful. Please verify your email.',
            'user': {
                'email': email,
                'name': user_data['name']
            }
        })
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 400

# Kid login with code
@app.route('/api/auth/kid-login', methods=['POST'])
def kid_login():
    try:
        data = request.get_json()
        code = data.get('code')
        
        # Mock kid authentication (in production, verify against database)
        if code and len(code) == 4 and code.isdigit():
            kid_data = {
                'kid_id': f'kid_{code}',
                'name': f'Kid {code}',
                'code': code,
                'type': 'kid'
            }
            
            app_token = generate_jwt_token({
                'email': f'kid_{code}@aidiy.com',
                'name': kid_data['name']
            })
            
            return jsonify({
                'success': True,
                'user': kid_data,
                'appToken': app_token
            })
        else:
            return jsonify({'error': 'Invalid kid code'}), 401
            
    except Exception as e:
        print(f"Kid login error: {e}")
        return jsonify({'error': 'Login failed'}), 400

# Send OTP
@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Generate OTP
        otp_code = generate_otp()
        
        # Store OTP with expiration (5 minutes)
        otp_store[email] = {
            'code': otp_code,
            'expires_at': datetime.utcnow() + timedelta(minutes=5),
            'attempts': 0
        }
        
        # In production, send real email
        print(f"OTP for {email}: {otp_code}")
        
        return jsonify({
            'success': True,
            'message': 'OTP sent successfully',
            # Don't return OTP in production!
            'otp': otp_code if app.debug else None
        })
        
    except Exception as e:
        print(f"Send OTP error: {e}")
        return jsonify({'error': 'Failed to send OTP'}), 400

# Verify OTP
@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')
        
        if not email or not otp:
            return jsonify({'error': 'Email and OTP are required'}), 400
        
        # Check if OTP exists
        if email not in otp_store:
            return jsonify({'error': 'No OTP found for this email'}), 401
        
        stored_otp = otp_store[email]
        
        # Check if OTP expired
        if datetime.utcnow() > stored_otp['expires_at']:
            del otp_store[email]
            return jsonify({'error': 'OTP has expired'}), 401
        
        # Check attempts
        if stored_otp['attempts'] >= 3:
            del otp_store[email]
            return jsonify({'error': 'Too many failed attempts'}), 401
        
        # Verify OTP
        if otp == stored_otp['code']:
            # Mark user as verified
            if email in users_db:
                users_db[email]['verified'] = True
            
            # Clear OTP
            del otp_store[email]
            
            return jsonify({
                'success': True,
                'message': 'OTP verified successfully'
            })
        else:
            # Increment attempts
            otp_store[email]['attempts'] += 1
            return jsonify({'error': 'Invalid OTP'}), 401
            
    except Exception as e:
        print(f"Verify OTP error: {e}")
        return jsonify({'error': 'OTP verification failed'}), 400

# Reset password
@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        email = data.get('email')
        new_password = data.get('newPassword')
        
        # Mock password reset
        return jsonify({
            'success': True,
            'message': 'Password reset successfully'
        })
        
    except Exception as e:
        print(f"Reset password error: {e}")
        return jsonify({'error': 'Password reset failed'}), 400

# Get user profile
@app.route('/api/users/profile', methods=['GET'])
def get_profile():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        token = auth_header.replace('Bearer ', '')
        user_data = verify_jwt_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid token'}), 401
        
        return jsonify({
            'success': True,
            'user': users_db.get(user_data['email'], user_data)
        })
        
    except Exception as e:
        print(f"Get profile error: {e}")
        return jsonify({'error': 'Failed to get profile'}), 400

# Get children
@app.route('/api/users/children', methods=['GET'])
def get_children():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        token = auth_header.replace('Bearer ', '')
        user_data = verify_jwt_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid token'}), 401
        
        user_children = children_db.get(user_data['email'], [])
        
        return jsonify({
            'success': True,
            'children': user_children
        })
        
    except Exception as e:
        print(f"Get children error: {e}")
        return jsonify({'error': 'Failed to get children'}), 400

# Add child
@app.route('/api/users/children', methods=['POST'])
def add_child():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        token = auth_header.replace('Bearer ', '')
        user_data = verify_jwt_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid token'}), 401
        
        data = request.get_json()
        child_data = {
            'id': len(children_db.get(user_data['email'], [])) + 1,
            'firstName': data.get('firstName'),
            'lastName': data.get('lastName'),
            'nickName': data.get('nickName'),
            'birthDate': data.get('birthDate'),
            'loginCode': data.get('loginCode'),
            'moneyAccumulated': 0,
            'tasksAssigned': 0,
            'tasksCompleted': 0
        }
        
        if user_data['email'] not in children_db:
            children_db[user_data['email']] = []
        
        children_db[user_data['email']].append(child_data)
        
        return jsonify({
            'success': True,
            'child': child_data
        })
        
    except Exception as e:
        print(f"Add child error: {e}")
        return jsonify({'error': 'Failed to add child'}), 400

# Logout
@app.route('/api/auth/logout', methods=['POST'])
def logout():
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    })

if __name__ == '__main__':
    print("🚀 Starting AIDIY Flask Server...")
    print("📱 Frontend URL: http://localhost:3000")
    print("🔗 API Base URL: http://localhost:5500/api")
    app.run(host="localhost", port=5500, debug=True)
