from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, errors
from flask_mail import Mail, Message
from dotenv import load_dotenv
import bcrypt, jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os, random, string
from datetime import datetime, timedelta, timezone
import base64
import tempfile

# Load environment variables
load_dotenv()

# Development mode flag - default to False in production
DEV_MODE = os.getenv("DEV_MODE", "False") == "True"

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "CHANGE_ME")

# CORS configuration for production and development
allowed_origins = [
    "http://localhost:3000",  # Development
    "http://localhost:8080",  # Debug server
    "https://aidiy.ca",       # Production domain
    "https://www.aidiy.ca",   # Production www subdomain
]

# Add Vercel preview URLs in development
if DEV_MODE:
    allowed_origins.extend([
        "https://*.vercel.app",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://localhost:5500",  # Additional debug ports
        "http://localhost:9000"
    ])

CORS(
    app,
    resources={r"/*": {"origins": allowed_origins}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
)

# Flask-Mail configuration
app.config.update(
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_USE_TLS=os.getenv("MAIL_USE_TLS", "True") == "True",
    MAIL_USE_SSL=os.getenv("MAIL_USE_SSL", "False") == "True",
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_DEFAULT_SENDER=os.getenv("MAIL_USERNAME"),
)
mail = Mail(app)

# MongoDB connection
mongo_client = MongoClient(os.getenv("MONGO_URI"))
db = mongo_client["aidiy_app"]
users_col = db["users"]
pending_col = db["pending_users"]
otps_col = db["otps"]
children_col = db["children"]
goals_col = db["goals"]
notifications_col = db["notifications"]

# Security helpers
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_TOO")
JWT_EXPIRES_HOURS = 24

def generate_jwt_token(payload: dict) -> str:
    return jwt.encode(
        {**payload, "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRES_HOURS)},
        JWT_SECRET,
        algorithm="HS256",
    )

verify_jwt_token = lambda t: jwt.decode(t, JWT_SECRET, algorithms=["HS256"]) if t else None
hash_password = lambda p: bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
check_password = lambda p, h: bcrypt.checkpw(p.encode(), h.encode())
random_otp = lambda: "".join(random.choices(string.digits, k=6))

OTP_EXP_MIN = 5
MAX_OTP_ATTEMPTS = 3

# Basic routes for testing
@app.route("/")
def index():
    return jsonify(
        message="AIDIY API Server",
        status="running",
        time=datetime.now(timezone.utc).isoformat(),
        api_docs="Visit /api/health for health check"
    )

@app.route("/api/health")
def health():
    return jsonify(
        status="OK", 
        time=datetime.now(timezone.utc).isoformat(),
        platform="Vercel"
    )

# Google sign-in
CLIENT_ID = "1096697062195-l7ip7k3ib9en1gferiklgca206dnpeoj.apps.googleusercontent.com"

@app.route("/auth/google", methods=["POST"])
def google_login():
    tok = (request.get_json() or {}).get("token")
    if not tok:
        return jsonify(error="No token"), 400
    try:
        info = id_token.verify_oauth2_token(tok, google_requests.Request(), CLIENT_ID)
    except Exception as e:
        print(f"[Google Auth Error] {type(e).__name__}: {str(e)}")
        # Check if it's a network-related error
        if "network" in str(e).lower() or "connection" in str(e).lower() or "timeout" in str(e).lower():
            return jsonify(error="Network error: Unable to verify token with Google"), 503
        else:
            return jsonify(error=f"Token verification failed: {str(e)}"), 400

    email = info["email"]
    user = users_col.find_one({"email": email})

    if not user:
        user = {
            "email": email,
            "name": info.get("name"),
            "firstName": info.get("given_name"),
            "lastName": info.get("family_name"),
            "picture": info.get("picture"),
            "login_type": "google",
            "isVerified": True,  # Auto-verify on Vercel
            "password": None,
            "isProfileComplete": False,
            "hasCompletedAssessment": False,
        }
        users_col.insert_one(user)
    
    # Check if user profile is complete
    isProfileComplete = user.get("isProfileComplete", False)
    
    tok = generate_jwt_token({"email": email, "name": user["name"]})
    return jsonify(
        success=True,
        user={"email": email, "name": user["name"], "isProfileComplete": isProfileComplete},
        appToken=tok,
    ) 