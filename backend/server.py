from flask import jsonify, request, session, make_response
import firebase_admin
from firebase_admin import credentials, auth, firestore
from dotenv import load_dotenv
import os
from config import app
import yfinance as yf
import json

# Load environment variables
load_dotenv()

firebase_cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT")
if not firebase_cred_path:
    raise ValueError("FIREBASE_SERVICE_ACCOUNT environment variable not set.")

cred = credentials.Certificate(firebase_cred_path)
firebase_admin.initialize_app(cred)

finhub_key = os.getenv("FINHUB_API")
if not finhub_key:
    raise ValueError("FINHUB environment variable not set.")

# Initialize Firestore
db = firestore.client()

@app.route("/server-test", methods=['POST'])
def server_test():
    return jsonify({'message': 'Server OK'})

@app.route("/signup", methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 400

    try:
        user = auth.create_user(email=email, password=password)

        # Add user details to Firestore
        db.collection("users").document(user.uid).set({
            "email": email,
            "uid": user.uid,
        })

        return jsonify({'message': 'Account created successfully!', 'uid': user.uid}), 201
    except Exception as e:
        return jsonify({'message': 'Failed to create account.', 'error': str(e)}), 500


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    try:
        user = auth.get_user_by_email(email)
        session["uid"] = user.uid
        print('session uid', session.get("uid"))
        return jsonify({"message": "Login successful!", "uid": user.uid}), 200
    except firebase_admin.auth.UserNotFoundError:
        return jsonify({"message": "User not found."}), 404
    except Exception as e:
        return jsonify({"message": "Login failed.", "error": str(e)}), 500

@app.route('/logout', methods=['OPTIONS', 'POST'])
def logout():
    if request.method == 'OPTIONS':  # Handle preflight request
        response = make_response()
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response, 200

    # Handle the actual POST request
    if 'uid' in session:
        session.clear()
        response = jsonify({"message": "User logged out successfully"})
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 200
    else:
        response = jsonify({"error": "No user logged in"})
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 400

@app.route("/stock-graph/<stock_symbol>/<interval>", methods=["GET"])
def stock_graph(stock_symbol, interval):
    """
    Fetch stock data for a given symbol and interval using yfinance, and send it as JSON to React.
    """
    try:
        # Map intervals to yfinance's valid periods and intervals
        interval_map = {
            "minutes": ("7d", "5m"),  # Last 7 days, 5-minute interval
            "days": ("1mo", "1d"),    # Last month, 1-day interval
            "months": ("1y", "1wk"),  # Last year, 1-week interval
            "years": ("5y", "1mo")    # Last 5 years, 1-month interval
        }

        if interval not in interval_map:
            return jsonify({
                "message": f"Invalid interval '{interval}'. Valid intervals: minutes, days, months, years."
            }), 400

        period, interval = interval_map[interval]

        # Fetch stock data using yfinance
        stock = yf.Ticker(stock_symbol)
        hist = stock.history(period=period, interval=interval)

        if hist.empty:
            return jsonify({
                "message": "No data found for the stock symbol or interval.",
                "symbol": stock_symbol,
                "interval": interval
            }), 400

        # Extract data for Chart.js
        labels = hist.index.strftime('%Y-%m-%d').tolist()  # Convert dates to strings
        data = hist['Close'].tolist()  # Closing prices

        return jsonify({"labels": labels, "data": data}), 200

    except Exception as e:
        return jsonify({
            "message": "Error generating stock data.",
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
