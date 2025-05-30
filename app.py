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

# ── ENV / Flask / CORS ────────────────────────────────────────────────────────
load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "CHANGE_ME")
CORS(app,
     resources={r"/*": {"origins": "http://localhost:3000"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"])

# ── Flask-Mail config ─────────────────────────────────────────────────────────
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

# ── MongoDB ───────────────────────────────────────────────────────────────────
client = MongoClient(os.getenv("MONGO_URI"))
db              = client["aidiy_app"]
users_col       = db["users"]
pending_col     = db["pending_users"]   # <── new
otps_col        = db["otps"]
children_col    = db["children"]

# ── Security helpers ─────────────────────────────────────────────────────────-
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_TOO")
JWT_EXPIRES_HOURS = 24

def generate_jwt_token(user):
    return jwt.encode(
        {
            "email": user["email"],
            "name":  user.get("name"),
            "exp":   datetime.utcnow() + timedelta(hours=JWT_EXPIRES_HOURS)
        },
        JWT_SECRET,
        algorithm="HS256"
    )

def verify_jwt_token(tok):
    try:  return jwt.decode(tok, JWT_SECRET, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

hash_password   = lambda p: bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
check_password  = lambda p, h: bcrypt.checkpw(p.encode(), h.encode())
random_otp      = lambda: "".join(random.choices(string.digits, k=6))

OTP_EXP_MIN       = 5
MAX_OTP_ATTEMPTS  = 3

# ── OTP logic ─────────────────────────────────────────────────────────────────
def create_and_store_otp(email):
    code        = random_otp()
    expires_at  = datetime.utcnow() + timedelta(minutes=OTP_EXP_MIN)
    otps_col.update_one(
        {"email": email},
        {"$set": {"otp": code, "expires_at": expires_at, "attempts": 0}},
        upsert=True,
    )
    # send the mail
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
    return code

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jsonify(status="OK", time=datetime.utcnow().isoformat())

# ---------- 1  REGISTER (store in pending, no OTP yet) ------------------------
@app.route("/api/auth/register", methods=["POST"])
def register():
    data      = request.get_json() or {}
    required  = ["firstName", "lastName", "email", "password"]
    if any(not data.get(k) for k in required):
        return jsonify(error="Missing required fields"), 400

    email = data["email"]
    if users_col.find_one({"email": email}):
        return jsonify(error="Email already registered & verified"), 409

    # save to pending (overwrite if the user re-starts flow)
    pending_col.update_one(
        {"email": email},
        {"$set": {
            "email":      email,
            "firstName":  data["firstName"],
            "lastName":   data["lastName"],
            "name":       f"{data['firstName']} {data['lastName']}",
            "phoneNumber":data.get("phoneNumber"),
            "password":   hash_password(data["password"]),
            "created_at": datetime.utcnow(),
        }},
        upsert=True,
    )
    # client must now call /api/auth/send-otp
    return jsonify(success=True, message="Registration saved. Call /send-otp to get code."), 201

# ---------- 2  SEND / RESEND OTP ---------------------------------------------
@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    email = (request.get_json() or {}).get("email")
    if not email:
        return jsonify(error="Email required"), 400

    if users_col.find_one({"email": email}):
        return jsonify(error="Account already verified"), 400
    if not pending_col.find_one({"email": email}):
        return jsonify(error="No pending registration for this email"), 404

    create_and_store_otp(email)
    return jsonify(success=True, message="OTP sent"), 200

@app.route("/api/auth/resend-otp", methods=["POST"])
def resend_otp():  # identical to send_otp
    return send_otp()

# ---------- 3  VERIFY OTP  (moves pending → users) ---------------------------
@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    data             = request.get_json() or {}
    email, otp_input = data.get("email"), data.get("otp")

    record = otps_col.find_one({"email": email})
    if not record:
        return jsonify(error="No OTP found"), 404
    if datetime.utcnow() > record["expires_at"]:
        otps_col.delete_one({"email": email})
        return jsonify(error="OTP expired"), 400
    if record["attempts"] >= MAX_OTP_ATTEMPTS:
        return jsonify(error="Max attempts exceeded"), 400
    if otp_input != record["otp"]:
        otps_col.update_one({"email": email}, {"$inc": {"attempts": 1}})
        return jsonify(error="Incorrect OTP"), 400

    # success → move user from pending to verified users
    pending_user = pending_col.find_one({"email": email})
    if not pending_user:
        return jsonify(error="Pending registration missing"), 400

    pending_user["isVerified"] = True
    users_col.insert_one(pending_user)
    pending_col.delete_one({"email": email})
    otps_col.delete_one({"email": email})

    return jsonify(success=True, message="Email verified. Account created!"), 200

# ---------- 4  EMAIL/PASSWORD LOGIN ------------------------------------------
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email, pwd = data.get("email"), data.get("password")
    if not email or not pwd:
        return jsonify(error="Email and password required"), 400

    user = users_col.find_one({"email": email})
    if not user or not check_password(pwd, user["password"]):
        return jsonify(error="Invalid credentials"), 401

    token = generate_jwt_token(user)
    return jsonify(success=True, user={"email": email, "name": user["name"]}, appToken=token)

# ---------- 5  GOOGLE LOGIN  (unchanged) -------------------------------------
CLIENT_ID = "237672950587-0fjv71akur45kfao2gf7anggc0ft1fit.apps.googleusercontent.com"
@app.route("/auth/google", methods=["POST"])
def google_login():
    id_token_str = (request.get_json() or {}).get("token")
    if not id_token_str:
        return jsonify(error="No token"), 400
    try:
        idinfo = id_token.verify_oauth2_token(id_token_str, google_requests.Request(), CLIENT_ID)
    except Exception:
        return jsonify(error="Token invalid"), 400

    email = idinfo["email"]
    user  = users_col.find_one({"email": email})
    if not user:
        user = {
            "email":     email,
            "name":      idinfo.get("name"),
            "firstName": idinfo.get("given_name"),
            "lastName":  idinfo.get("family_name"),
            "picture":   idinfo.get("picture"),
            "login_type":"google",
            "isVerified":True,
            "password":  None,
        }
        users_col.insert_one(user)

    token = generate_jwt_token(user)
    return jsonify(success=True, user={"email": email, "name": user["name"]}, appToken=token)

# ---------- 6  KID LOGIN  (unchanged) ----------------------------------------
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

    token = generate_jwt_token(kid)
    return jsonify(success=True, user={"email": kid_email, "name": kid["name"]}, appToken=token)

# ---------- 7  JWT DECORATOR --------------------------------------------------
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

# ---------- 8  PROFILE & CHILD ROUTES  (unchanged) ---------------------------
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

# ---------- 9  PASSWORD RESET (stub) -----------------------------------------
@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    return jsonify(success=True, message="Password reset flow not implemented"), 200

# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Starting AIDIY Flask Server on http://localhost:5500")
    app.run(host="localhost", port=5500, debug=True)
