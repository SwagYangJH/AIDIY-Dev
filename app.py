# backend/app.py
import os, random, string
from datetime import datetime, timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient, errors
from flask_mail import Mail, Message
from dotenv import load_dotenv
import bcrypt, jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# ────────────── ENV / Flask / CORS ──────────────────
load_dotenv()

# Development mode flag
DEV_MODE = os.getenv("DEV_MODE", "True") == "True"

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "CHANGE_ME")

CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
)

# ────────────── Flask-Mail ──────────────────────────
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

# ────────────── MongoDB ─────────────────────────────
client = MongoClient(os.getenv("MONGO_URI"))
db = client["aidiy_app"]
users_col = db["users"]
pending_col = db["pending_users"]
otps_col = db["otps"]
children_col = db["children"]

# enforce kid-username uniqueness
try:
    children_col.create_index("username", unique=True)
except errors.OperationFailure:
    pass

# ────────────── Security helpers ────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_TOO")
JWT_EXPIRES_HOURS = 24

def generate_jwt_token(payload: dict) -> str:
    return jwt.encode(
        {**payload, "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRES_HOURS)},
        JWT_SECRET,
        algorithm="HS256",
    )

verify_jwt_token = lambda t: jwt.decode(t, JWT_SECRET, algorithms=["HS256"]) if t else None
hash_password = lambda p: bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
check_password = lambda p, h: bcrypt.checkpw(p.encode(), h.encode())
random_otp = lambda: "".join(random.choices(string.digits, k=6))

OTP_EXP_MIN = 5
MAX_OTP_ATTEMPTS = 3

# ────────────── OTP helpers ─────────────────────────
def send_otp_email(email, code):
    try:
        body = (
            f"Your OTP code is {code}. It expires in {OTP_EXP_MIN} minutes.\n\n"
            "If you did not request this, please ignore."
        )
        mail.send(Message("Your AIDIY OTP Code", recipients=[email], body=body))
        print(f"[MAIL] OTP sent successfully to {email}")
        return True
    except Exception as e:
        print(f"[MAIL] Could not send OTP → {email}: {e}")
        # Print OTP to console in dev environment
        print(f"[DEV] OTP for {email}: {code}")
        return False

def create_or_replace_otp(email, purpose):
    code = random_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXP_MIN)
    otps_col.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "otp": code,
                "purpose": purpose,
                "expires_at": expires_at,
                "attempts": 0,
                "validated": False,
            }
        },
        upsert=True,
    )
    send_otp_email(email, code)
    return code

# ────────────── Routes ──────────────────────────────
@app.route("/api/health")
def health():
    return jsonify(status="OK", time=datetime.utcnow().isoformat())

# ---------- 1  Registration ---------- #
REQUIRED_FIELDS = ("firstName", "lastName", "email", "password")  # slimmed down

@app.route("/api/auth/register", methods=["POST"])
def register():
    d = request.get_json() or {}
    if not all(d.get(f) for f in REQUIRED_FIELDS):
        return jsonify(error="Missing required fields"), 400

    email = d["email"]
    if users_col.find_one({"email": email}):
        return jsonify(error="Email already verified"), 409

    pending_col.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "firstName": d["firstName"],
                "lastName": d["lastName"],
                "name": f"{d['firstName']} {d['lastName']}",
                "phoneNumber": d.get("phoneNumber"),
                "password": hash_password(d["password"]),
                # sensible defaults so backend is happy later
                "birthDate": d.get("birthDate", ""),
                "username": d.get("username", ""),
                "loginCode": d.get("loginCode", ""),
                "avatar": d.get("avatar", "🙂"),
                "isProfileComplete": False,  # New users default to incomplete profile
                "created_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )
    return (
        jsonify(success=True, message="Registration saved. Call /send-otp to get code."),
        201,
    )

# ---------- 2  Send / Resend OTP ---------- #
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    email = (request.get_json() or {}).get("email")
    if not email:
        return jsonify(error="Email required"), 400

    purpose = (
        "reset"
        if users_col.find_one({"email": email})
        else "verify"
        if pending_col.find_one({"email": email})
        else None
    )
    if not purpose:
        return jsonify(error="Email not found"), 404

    create_or_replace_otp(email, purpose)
    return jsonify(success=True, message=f"OTP sent for {purpose}"), 200

@app.route("/api/auth/resend-otp", methods=["POST"])
def resend_otp():
    return send_otp()

# ---------- 3  Verify OTP (handles sign-up + password-reset) ---------- #
@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    d = request.get_json() or {}
    email, otp_input = d.get("email"), d.get("otp")

    # Find the OTP doc (any purpose) -----------------------------------
    rec = otps_col.find_one({"email": email})
    if not rec:
        return jsonify(error="No OTP found"), 404
    if datetime.utcnow() > rec["expires_at"]:
        otps_col.delete_one({"_id": rec["_id"]})
        return jsonify(error="OTP expired"), 400
    if rec["attempts"] >= MAX_OTP_ATTEMPTS:
        return jsonify(error="Too many attempts"), 403
    if otp_input != rec["otp"]:
        otps_col.update_one({"_id": rec["_id"]}, {"$inc": {"attempts": 1}})
        return jsonify(error="Incorrect OTP"), 400

    # ---------- purpose-specific logic ----------
    if rec["purpose"] == "verify":
        # ✧ Sign-up / e-mail verification flow
        pending = pending_col.find_one({"email": email})
        if not pending:
            return jsonify(error="Pending registration missing"), 400
        pending["isVerified"] = True
        users_col.insert_one(pending)
        pending_col.delete_one({"email": email})
        # Remove OTP – it has served its purpose
        otps_col.delete_one({"_id": rec["_id"]})
        return jsonify(success=True, message="Email verified."), 200

    elif rec["purpose"] == "reset":
        # ✧ Password-reset flow
        otps_col.update_one(
            {"_id": rec["_id"]},
            {"$set": {"validated": True}, "$unset": {"otp": ""}}
        )
        return jsonify(success=True, message="OTP validated."), 200

    else:
        return jsonify(error="Unknown OTP purpose"), 400


# ---------- 4  Reset password ---------- #
@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    d = request.get_json() or {}

    # the UI sends { email, newPassword }
    email     = d.get("email")
    new_pwd   = d.get("newPassword")   # keep the exact key the UI sends
    # you can also accept an alias if you like:
    # new_pwd = d.get("newPassword") or d.get("password")

    if not email or not new_pwd:
        return jsonify(error="Email and newPassword required"), 400

    doc = otps_col.find_one(
        {"email": email, "purpose": "reset", "validated": True}
    )
    if not doc:
        return jsonify(error="OTP not validated"), 403

    users_col.update_one(
        {"email": email},
        {"$set": {"password": hash_password(new_pwd)}}
    )
    # delete the OTP after successful reset so it can't be reused
    otps_col.delete_one({"_id": doc["_id"]})

    return jsonify(success=True, message="Password reset successfully"), 200

# ---------- 5  Parent login ---------- #
@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.get_json() or {}
    email, pwd = d.get("email"), d.get("password")
    if not email or not pwd:
        return jsonify(error="Email and password required"), 400

    user = users_col.find_one({"email": email})
    if not user or not check_password(pwd, user["password"]):
        return jsonify(error="Invalid credentials"), 401

    # Check if user profile is complete
    isProfileComplete = user.get("isProfileComplete", False)
    
    tok = generate_jwt_token({"email": email, "name": user["name"]})
    return jsonify(
        success=True,
        user={"email": email, "name": user["name"], "isProfileComplete": isProfileComplete},
        appToken=tok,
    )

@app.route("/api/auth/logout", methods=["POST"])
def logout_route():
    return jsonify(success=True)

# ---------- 6  Google sign-in ---------- #
CLIENT_ID = "237672950587-0fjv71akur45kfao2gf7anggc0ft1fit.apps.googleusercontent.com"

@app.route("/auth/google", methods=["POST"])
def google_login():
    tok = (request.get_json() or {}).get("token")
    if not tok:
        return jsonify(error="No token"), 400
    try:
        info = id_token.verify_oauth2_token(tok, google_requests.Request(), CLIENT_ID)
    except Exception:
        return jsonify(error="Token invalid"), 400

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
            "isVerified": DEV_MODE,  # Auto-verify in dev mode
            "password": None,
            "isProfileComplete": False,
        }
        users_col.insert_one(user)

    # Skip OTP verification in dev mode
    if not user.get("isVerified") and not DEV_MODE:
        create_or_replace_otp(email, "verify")
        return (
            jsonify(success=True, otpRequired=True, message="OTP sent to email"),
            200,
        )

    # Check if user profile is complete
    isProfileComplete = user.get("isProfileComplete", False)
    
    tok = generate_jwt_token({"email": email, "name": user["name"]})
    return jsonify(
        success=True,
        user={"email": email, "name": user["name"], "isProfileComplete": isProfileComplete},
        appToken=tok,
    )

@app.route("/auth/google/verify-otp", methods=["POST"])
def google_verify_otp():
    d = request.get_json() or {}
    email, otp_input = d.get("email"), d.get("otp")

    rec = otps_col.find_one({"email": email, "purpose": "verify"})
    if not rec:
        return jsonify(error="Invalid OTP"), 400
    if datetime.utcnow() > rec["expires_at"]:
        return jsonify(error="OTP expired"), 400
    if rec["attempts"] >= MAX_OTP_ATTEMPTS:
        return jsonify(error="Too many attempts"), 403
    if otp_input != rec["otp"]:
        otps_col.update_one({"email": email}, {"$inc": {"attempts": 1}})
        return jsonify(error="Incorrect OTP"), 400

    users_col.update_one({"email": email}, {"$set": {"isVerified": True}})
    otps_col.delete_one({"email": email})

    user = users_col.find_one({"email": email})
    # Check if user profile is complete
    isProfileComplete = user.get("isProfileComplete", False)
    
    tok = generate_jwt_token({"email": email, "name": user["name"]})
    return jsonify(
        success=True,
        user={"email": email, "name": user["name"], "isProfileComplete": isProfileComplete},
        appToken=tok,
    )

# ---------- 7  Kid login ---------- #
@app.route("/api/auth/kid-login", methods=["POST"])
def kid_login():
    d = request.get_json() or {}
    username = d.get("username", "").strip()
    code = d.get("code", "")
    if not username or len(code) != 4 or not code.isdigit():
        return jsonify(error="Username and 4-digit code required"), 400

    child = children_col.find_one({"username": username, "loginCode": code})
    if not child:
        return jsonify(error="Invalid kid credentials"), 401

    tok = generate_jwt_token(
        {
            "email": f"{username}@kids.aidiy",
            "name": child.get("nickName") or child["firstName"],
        }
    )
    return jsonify(
        success=True,
        user={
            "username": username,
            "name": child.get("nickName") or child["firstName"],
        },
        appToken=tok,
    )

# ---------- 8  Auth decorator ---------- #
def auth_required(fn):
    def inner(*a, **kw):
        hdr = request.headers.get("Authorization", "")
        if not hdr.startswith("Bearer "):
            return jsonify(error="No token"), 401
        try:
            request.user = verify_jwt_token(hdr[7:])
        except jwt.ExpiredSignatureError:
            return jsonify(error="Token expired"), 401
        except Exception:
            return jsonify(error="Invalid token"), 401
        return fn(*a, **kw)

    inner.__name__ = fn.__name__
    return inner

@app.route("/api/users/profile")
@auth_required
def profile():
    user = users_col.find_one({"email": request.user["email"]}, {"_id": 0, "password": 0})
    return jsonify(success=True, user=user)

# ---------- Update user profile ---------- #
@app.route("/api/users/profile", methods=["PUT"])
@auth_required
def update_profile():
    d = request.get_json() or {}
    
    # Allowed fields to update
    allowed_fields = ["firstName", "lastName", "phoneNumber", "birthDate", "parentRole"]
    update_data = {k: v for k, v in d.items() if k in allowed_fields and v is not None}
    
    if update_data:
        # If firstName and lastName exist, update name field
        if "firstName" in update_data or "lastName" in update_data:
            user = users_col.find_one({"email": request.user["email"]})
            firstName = update_data.get("firstName", user.get("firstName", ""))
            lastName = update_data.get("lastName", user.get("lastName", ""))
            update_data["name"] = f"{firstName} {lastName}"
        
        # Mark profile as complete
        update_data["isProfileComplete"] = True
        
        users_col.update_one(
            {"email": request.user["email"]},
            {"$set": update_data}
        )
        
        return jsonify(success=True, message="Profile updated successfully")
    
    return jsonify(error="No valid fields to update"), 400

# ---------- Children management ---------- #
@app.route("/api/users/children")
@auth_required
def children_get():
    kids = list(
        children_col.find({"parent_email": request.user["email"]}, {"_id": 0})
    )
    return jsonify(success=True, children=kids)

@app.route("/api/users/children", methods=["POST"])
@auth_required
def children_add():
    d = request.get_json() or {}
    required = ("firstName", "lastName", "birthDate", "loginCode", "username")
    if not all(d.get(k) for k in required):
        return jsonify(error="Missing fields"), 400

    if children_col.find_one({"username": d["username"]}):
        return jsonify(error="Username already taken"), 409

    child = {
        "parent_email": request.user["email"],
        "id": d["loginCode"],
        "username": d["username"],
        "firstName": d["firstName"],
        "lastName": d["lastName"],
        "nickName": d.get("nickName", ""),
        "avatar": d.get("avatar", "👧"),
        "birthDate": d["birthDate"],
        "loginCode": d["loginCode"],
        "moneyAccumulated": 0,
        "tasksAssigned": 0,
        "tasksCompleted": 0,
        "created_at": datetime.utcnow(),
    }

    children_col.insert_one(child)
    child.pop("_id", None)
    return jsonify(success=True, child=child), 201

# ────────────── Run ────────────────────────────────
if __name__ == "__main__":
    print("Starting AIDIY Flask Server on http://localhost:5500")
    app.run(host="localhost", port=5500, debug=True)
