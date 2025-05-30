# app.py
import os, random, string
from datetime import datetime, timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from flask_mail import Mail, Message
from dotenv import load_dotenv
import bcrypt, jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# ─────────────────────────── ENV / Flask / CORS ──────────────────────────────
load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "CHANGE_ME")

CORS(app,
     resources={r"/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"])

# ─────────────────────────── Flask-Mail config ───────────────────────────────
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

# ─────────────────────────────── MongoDB  ─────────────────────────────────────
client         = MongoClient(os.getenv("MONGO_URI"))
db             = client["aidiy_app"]
users_col      = db["users"]
pending_col    = db["pending_users"]      # temp store before email verified
otps_col       = db["otps"]               # one doc per email
children_col   = db["children"]

# ─────────────────────────── Security helpers ────────────────────────────────
JWT_SECRET        = os.getenv("JWT_SECRET", "CHANGE_ME_TOO")
JWT_EXPIRES_HOURS = 24

def generate_jwt_token(user):
    return jwt.encode(
        {
            "email": user["email"],
            "name":  user.get("name"),
            "exp":   datetime.utcnow() + timedelta(hours=JWT_EXPIRES_HOURS)
        }, JWT_SECRET, algorithm="HS256")

verify_jwt_token = lambda tok: (
    jwt.decode(tok, JWT_SECRET, algorithms=["HS256"])
    if tok else None
)
hash_password  = lambda p: bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
check_password = lambda p, h: bcrypt.checkpw(p.encode(), h.encode())
random_otp     = lambda: "".join(random.choices(string.digits, k=6))

OTP_EXP_MIN       = 5
MAX_OTP_ATTEMPTS  = 3

# ──────────────────────── OTP helpers  ───────────────────────────────────────
def send_otp_email(email, code):
    try:
        mail.send(Message(
            subject="Your AIDIY OTP Code",
            recipients=[email],
            body=(
                f"Your OTP code is: {code}\n"
                f"It expires in {OTP_EXP_MIN} minutes.\n\n"
                "If you did not request this, please ignore this email."
            ),
        ))
    except Exception as e:
        print(f"[MAIL] Could not send OTP to {email}: {e}")

def create_or_replace_otp(email, purpose):
    code       = random_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXP_MIN)
    otps_col.update_one(
        {"email": email},
        {"$set": {
            "email":      email,
            "otp":        code,
            "purpose":    purpose,           # "verify" or "reset"
            "expires_at": expires_at,
            "attempts":   0,
            "validated":  False              # set True only after correct entry
        }},
        upsert=True
    )
    send_otp_email(email, code)
    return code

# ─────────────────────────────── Routes ──────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify(status="OK", time=datetime.utcnow().isoformat())

# ───────── 1  Registration (store in pending) ────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    d = request.get_json() or {}
    for f in ("firstName", "lastName", "email", "password"):
        if not d.get(f):
            return jsonify(error="Missing required fields"), 400

    email = d["email"]
    if users_col.find_one({"email": email}):
        return jsonify(error="Email already verified"), 409

    pending_col.update_one(
        {"email": email},
        {"$set": {
            "email": email,
            "firstName": d["firstName"],
            "lastName":  d["lastName"],
            "name":      f"{d['firstName']} {d['lastName']}",
            "phoneNumber": d.get("phoneNumber"),
            "password": hash_password(d["password"]),
            "created_at": datetime.utcnow()
        }},
        upsert=True
    )
    return jsonify(success=True,
                   message="Registration saved. Call /send-otp to get code."), 201

# ───────── 2  Send / resend OTP  (signup OR reset) ───────────────────────────
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    email = (request.get_json() or {}).get("email")
    if not email:
        return jsonify(error="Email required"), 400

    if users_col.find_one({"email": email}):
        purpose = "reset"
    elif pending_col.find_one({"email": email}):
        purpose = "verify"
    else:
        return jsonify(error="Email not found"), 404

    create_or_replace_otp(email, purpose)
    return jsonify(success=True, message=f"OTP sent for {purpose}"), 200

@app.route("/api/auth/resend-otp", methods=["POST"])
def resend_otp():
    return send_otp()

# ───────── 3  Verify OTP ─────────────────────────────────────────────────────
@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    d = request.get_json() or {}
    email, otp_input = d.get("email"), d.get("otp")

    rec = otps_col.find_one({"email": email})
    if not rec:
        return jsonify(error="No OTP found"), 404
    if datetime.utcnow() > rec["expires_at"]:
        otps_col.delete_one({"email": email})
        return jsonify(error="OTP expired"), 400
    if rec["attempts"] >= MAX_OTP_ATTEMPTS:
        return jsonify(error="Max attempts exceeded"), 400
    if otp_input != rec["otp"]:
        otps_col.update_one({"email": email}, {"$inc": {"attempts": 1}})
        return jsonify(error="Incorrect OTP"), 400

    purpose = rec["purpose"]
    if purpose == "verify":
        pending = pending_col.find_one({"email": email})
        if not pending:
            return jsonify(error="Pending registration missing"), 400
        pending["isVerified"] = True
        users_col.insert_one(pending)
        pending_col.delete_one({"email": email})
        otps_col.delete_one({"email": email})
        return jsonify(success=True, message="Email verified. Account created!"), 200

    # purpose == "reset"
    otps_col.update_one({"email": email},
                        {"$set": {"validated": True},
                         "$unset": {"otp": ""}})
    return jsonify(success=True,
                   message="OTP verified. You can now reset your password."), 200

# ───────── 4  Reset password (requires validated OTP) ────────────────────────
@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    d = request.get_json() or {}
    email, new_pwd = d.get("email"), d.get("newPassword")
    if not email or not new_pwd:
        return jsonify(error="Email and newPassword required"), 400

    otp_doc = otps_col.find_one({"email": email, "purpose": "reset", "validated": True})
    if not otp_doc:
        return jsonify(error="OTP not validated for this email"), 403

    users_col.update_one({"email": email},
                         {"$set": {"password": hash_password(new_pwd)}})
    otps_col.delete_one({"email": email})
    return jsonify(success=True, message="Password reset successfully"), 200

# ───────── 5  Email/password login ───────────────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.get_json() or {}
    email, pwd = d.get("email"), d.get("password")
    if not email or not pwd:
        return jsonify(error="Email and password required"), 400

    user = users_col.find_one({"email": email})
    if not user or not check_password(pwd, user["password"]):
        return jsonify(error="Invalid credentials"), 401

    tok = generate_jwt_token(user)
    return jsonify(success=True, user={"email": email, "name": user["name"]},
                   appToken=tok)

# ───────── 6  Google login (unchanged) ───────────────────────────────────────
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
    user  = users_col.find_one({"email": email})
    if not user:
        user = {
            "email": email,
            "name": info.get("name"),
            "firstName": info.get("given_name"),
            "lastName":  info.get("family_name"),
            "picture":   info.get("picture"),
            "login_type":"google",
            "isVerified":True,
            "password":  None,
        }
        users_col.insert_one(user)

    tok = generate_jwt_token(user)
    return jsonify(success=True, user={"email": email, "name": user["name"]},
                   appToken=tok)

# ───────── 7  Kid login (unchanged) ──────────────────────────────────────────
@app.route("/api/auth/kid-login", methods=["POST"])
def kid_login():
    code = (request.get_json() or {}).get("code", "")
    if len(code) != 4 or not code.isdigit():
        return jsonify(error="Invalid kid code"), 400

    kid_email = f"kid_{code}@aidiy.com"
    kid = users_col.find_one({"email": kid_email})
    if not kid:
        kid = {"email": kid_email, "name": f"Kid {code}", "login_type": "kid", "isVerified": True}
        users_col.insert_one(kid)

    tok = generate_jwt_token(kid)
    return jsonify(success=True, user={"email": kid_email, "name": kid["name"]},
                   appToken=tok)

# ───────── 8  Auth decorator  ────────────────────────────────────────────────
def auth_required(fn):
    def inner(*a, **kw):
        hdr = request.headers.get("Authorization", "")
        if not hdr.startswith("Bearer "):
            return jsonify(error="No token"), 401
        user = verify_jwt_token(hdr[7:])
        if not user:
            return jsonify(error="Token invalid or expired"), 401
        request.user = user
        return fn(*a, **kw)
    inner.__name__ = fn.__name__
    return inner

# ───────── 9  Profile & children routes (unchanged) ──────────────────────────
@app.route("/api/users/profile")
@auth_required
def profile():
    email = request.user["email"]
    user = users_col.find_one({"email": email}, {"password": 0})
    return jsonify(success=True, user=user)

@app.route("/api/users/children")
@auth_required
def children_get():
    kids = list(children_col.find({"parent_email": request.user["email"]}, {"_id": 0}))
    return jsonify(success=True, children=kids)

@app.route("/api/users/children", methods=["POST"])
@auth_required
def children_add():
    d = request.get_json() or {}
    for f in ("firstName", "lastName", "birthDate", "loginCode"):
        if not d.get(f):
            return jsonify(error="Missing fields"), 400
    child = {
        "parent_email": request.user["email"],
        "id": d["loginCode"],
        **{k: d[k] for k in ("firstName", "lastName", "nickName", "birthDate", "loginCode")},
        "moneyAccumulated": 0, "tasksAssigned": 0, "tasksCompleted": 0,
    }
    children_col.update_one(
        {"parent_email": child["parent_email"], "id": child["id"]},
        {"$set": child}, upsert=True)
    return jsonify(success=True, child=child)

# ───────────────────────────────── Run ───────────────────────────────────────
if __name__ == "__main__":
    print("Starting AIDIY Flask Server on http://localhost:5500")
    app.run(host="localhost", port=5500, debug=True)
