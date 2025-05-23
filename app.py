from flask import Flask, render_template, request, redirect

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/success')
def success():
    return render_template('success.html')

@app.route('/login', methods=['POST'])
def login():
    credential = request.form.get('credential')
    print(f"Google credential received: {credential}")
    # Here you can verify the token using Google's API if needed
    return redirect('/success')

if __name__ == '__main__':
    app.run(host="localhost", port=3000, debug=True)
