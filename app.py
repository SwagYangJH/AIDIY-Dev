# app.py
import os
import random
import string
from datetime import datetime, timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from flask_mail import Mail, Message          # NEW
from dotenv import load_dotenv                # NEW
import bcrypt
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# ── Load environment variables ────────────────────────────────────────────────
load_dotenv()  # loads .env into os.environ

# ── Flask & CORS ──────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "CHANGE_ME")
CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
)

# ── Flask-Mail configuration ─────────────────────────────────────────────────
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

# ── MongoDB ──────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "aidiy_app"
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_col = db["users"]
otps_col = db["otps"]
children_col = db["children"]

# ── Auth / security helpers ──────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_TOO")
JWT_EXPIRES_HOURS = 24


def generate_jwt_token(user_doc: dict) -> str:
    payload = {
        "email": user_doc["email"],
        "name": user_doc.get("name"),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRES_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_jwt_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def check_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def random_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


# ── OTP helpers ───────────────────────────────────────────────────────────────
OTP_EXP_MIN = 5
MAX_OTP_ATTEMPTS = 3


def create_and_store_otp(email: str):
    """Generate a 6-digit OTP, store it in MongoDB, and send it by email."""
    code = random_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXP_MIN)
    otps_col.update_one(
        {"email": email},
        {"$set": {"otp": code, "expires_at": expires_at, "attempts": 0}},
        upsert=True,
    )

    # Send the OTP via email
    try:
        msg = Message(
            subject="Your AIDIY OTP Code",
            recipients=[email],
            body=f"Your OTP code is: {code}\n"
                 f"It expires in {OTP_EXP_MIN} minutes.\n\n"
                 "If you did not request this, please ignore this email.",
        )
        mail.send(msg)
    except Exception as e:
        print(f"[MAIL] Failed to send OTP email to {email}: {e}")

    return code


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify(
        status="OK",
        message="AIDIY Flask Server running",
        timestamp=datetime.utcnow().isoformat(),
    )


# ---------- Registration ------------------------------------------------------
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    required = ["firstName", "lastName", "email", "password"]
    if any(not data.get(f) for f in required):
        return jsonify(error="Missing required fields"), 400

    if users_col.find_one({"email": data["email"]}):
        return jsonify(error="Email already registered"), 409

    user_doc = {
        "email": data["email"],
        "firstName": data["firstName"],
        "lastName": data["lastName"],
        "name": f"{data['firstName']} {data['lastName']}",
        "phoneNumber": data.get("phoneNumber"),
        "password": hash_password(data["password"]),
        "isVerified": False,
        "login_type": "email",
        "picture": None,
    }
    users_col.insert_one(user_doc)
    create_and_store_otp(data["email"])
    return jsonify(success=True, message="Registered. OTP sent for verification"), 201


# ---------- Email / password login -------------------------------------------
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email, pwd = data.get("email"), data.get("password")
    if not email or not pwd:
        return jsonify(error="Email and password required"), 400

    user = users_col.find_one({"email": email})
    if not user or not check_password(pwd, user["password"]):
        return jsonify(error="Invalid email or password"), 401
    if not user.get("isVerified"):
        return jsonify(error="Account not verified"), 403

    token = generate_jwt_token(user)
    return jsonify(success=True, user={k: user[k] for k in ("email", "name")}, appToken=token)


# ---------- Google login ------------------------------------------------------
CLIENT_ID = "237672950587-0fjv71akur45kfao2gf7anggc0ft1fit.apps.googleusercontent.com"


@app.route("/auth/google", methods=["POST"])
def google_login():
    data = request.get_json() or {}
    id_token_str = data.get("token")
    if not id_token_str:
        return jsonify(error="No token"), 400
    try:
        idinfo = id_token.verify_oauth2_token(id_token_str, google_requests.Request(), CLIENT_ID)
    except Exception:
        return jsonify(error="Token invalid"), 400

    email = idinfo["email"]
    user = users_col.find_one({"email": email})
    if not user:
        user = {
            "email": email,
            "name": idinfo.get("name"),
            "firstName": idinfo.get("given_name"),
            "lastName": idinfo.get("family_name"),
            "picture": idinfo.get("picture"),
            "login_type": "google",
            "isVerified": True,
            "password": None,
        }
        users_col.insert_one(user)

    token = generate_jwt_token(user)
    return jsonify(success=True, user={"email": email, "name": user["name"]}, appToken=token)


# ---------- OTP send / resend -------------------------------------------------
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    email = (request.get_json() or {}).get("email")
    user = users_col.find_one({"email": email})
    if not user:
        return jsonify(error="User not found"), 404
    if user.get("isVerified"):
        return jsonify(error="User already verified"), 400
    create_and_store_otp(email)
    return jsonify(success=True, message="OTP sent"), 200


@app.route("/api/auth/resend-otp", methods=["POST"])
def resend_otp():
    return send_otp()


# ---------- OTP verification --------------------------------------------------
@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json() or {}
    email, otp = data.get("email"), data.get("otp")
    record = otps_col.find_one({"email": email})
    if not record:
        return jsonify(error="No OTP found"), 404
    if datetime.utcnow() > record["expires_at"]:
        otps_col.delete_one({"email": email})
        return jsonify(error="OTP expired"), 400
    if record.get("attempts", 0) >= MAX_OTP_ATTEMPTS:
        return jsonify(error="Max attempts exceeded"), 400
    if otp != record["otp"]:
        otps_col.update_one({"email": email}, {"$inc": {"attempts": 1}})
        return jsonify(error="Incorrect OTP"), 400

    users_col.update_one({"email": email}, {"$set": {"isVerified": True}})
    otps_col.delete_one({"email": email})
    return jsonify(success=True, message="Email verified"), 200


# ---------- Kid login ---------------------------------------------------------
@app.route("/api/auth/kid-login", methods=["POST"])
def kid_login():
    code = (request.get_json() or {}).get("code")
    if not code or len(code) != 4 or not code.isdigit():
        return jsonify(error="Invalid kid code"), 400

    kid_email = f"kid_{code}@aidiy.com"
    kid_user = users_col.find_one({"email": kid_email})
    if not kid_user:
        kid_user = {
            "email": kid_email,
            "name": f"Kid {code}",
            "login_type": "kid",
            "isVerified": True,
            "password": None,
        }
        users_col.insert_one(kid_user)

    token = generate_jwt_token(kid_user)
    return jsonify(success=True, user={"email": kid_email, "name": kid_user["name"]}, appToken=token)


# ---------- Auth decorator ----------------------------------------------------
def auth_required(func):
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify(error="No token"), 401
        user_data = verify_jwt_token(auth_header.replace("Bearer ", ""))
        if not user_data:
            return jsonify(error="Token invalid or expired"), 401
        request.user = user_data
        return func(*args, **kwargs)

    wrapper.__name__ = func.__name__
    return wrapper


# ---------- Profile & children endpoints -------------------------------------
@app.route("/api/users/profile", methods=["GET"])
@auth_required
def profile():
    email = request.user["email"]
    user = users_col.find_one({"email": email}, {"password": 0})
    return jsonify(success=True, user=user)


@app.route("/api/users/children", methods=["GET"])
@auth_required
def get_children():
    email = request.user["email"]
    kids = list(children_col.find({"parent_email": email}, {"_id": 0}))
    return jsonify(success=True, children=kids)


@app.route("/api/users/children", methods=["POST"])
@auth_required
def add_child():
    data = request.get_json() or {}
    required = ["firstName", "lastName", "birthDate", "loginCode"]
    if any(not data.get(f) for f in required):
        return jsonify(error="Missing fields"), 400

    child_doc = {
        "parent_email": request.user["email"],
        "id": data["loginCode"],
        "firstName": data["firstName"],
        "lastName": data["lastName"],
        "nickName": data.get("nickName"),
        "birthDate": data["birthDate"],
        "loginCode": data["loginCode"],
        "moneyAccumulated": 0,
        "tasksAssigned": 0,
        "tasksCompleted": 0,
    }
    children_col.update_one(
        {"parent_email": child_doc["parent_email"], "id": child_doc["id"]},
        {"$set": child_doc},
        upsert=True,
    )
    return jsonify(success=True, child=child_doc)


# ---------- Password reset stub ----------------------------------------------
@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    return jsonify(success=True, message="Password reset flow not implemented"), 200


# ── Run the app ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Starting AIDIY Flask Server on http://localhost:5500")
    app.run(host="localhost", port=5500, debug=True)
