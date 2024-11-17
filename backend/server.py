from flask import jsonify, request, session, make_response
import firebase_admin
from firebase_admin import credentials, auth, firestore
from dotenv import load_dotenv
import os
from config import app, PREDEFINED_TICKERS
import yfinance as yf
import json
from yahoo_fin import stock_info as si


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
        print("Login successful, session UID:", session.get("uid"))
        return jsonify({"message": "Login successful!", "uid": user.uid, 'session uid':session["uid"]}), 200
    except firebase_admin.auth.UserNotFoundError:
        return jsonify({"message": "User not found."}), 404
    except Exception as e:
        return jsonify({"message": "Login failed.", "error": str(e)}), 500
        
@app.route('/logout', methods=['OPTIONS', 'POST'])
def logout():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response, 200

    # Handle POST logout request
    data = request.get_json()
    uid = data.get("uid")

    if uid:
        try:
            # Clear session or revoke tokens
            session.clear()
            auth.revoke_refresh_tokens(uid)
            response = jsonify({"message": "User logged out successfully"})
            response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            return response, 200
        except Exception as e:
            response = jsonify({"error": f"Failed to log out: {str(e)}"})
            response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            return response, 500
    else:
        response = jsonify({"error": "No user logged in"})
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 400

@app.route("/stock-name/<stock_symbol>", methods=["GET"])
def get_stock_name(stock_symbol):
    """
    Fetch and return the stock name for a given symbol using yfinance.
    """
    try:
        # Use yfinance to fetch stock info
        stock = yf.Ticker(stock_symbol)
        stock_name = stock.info.get("shortName", "Unknown Stock")  # Get the stock name

        if not stock_name:
            return jsonify({"message": "Stock name not found"}), 404

        return jsonify({"stockName": stock_name}), 200
    except Exception as e:
        return jsonify({
            "message": "Error fetching stock name",
            "error": str(e)
        }), 500


@app.route("/stock-graph/<stock_symbol>/<interval>", methods=["GET"])
def stock_graph(stock_symbol, interval):
    """
    Fetch stock data for a given symbol and interval using yfinance, 
    and send it as JSON to React with OHLC data for candlestick chart.
    """
    try:
        # Map intervals to yfinance's valid periods and intervals
        interval_map = {
            "minutes": ("7d", "5m"),  # Last 7 days, 5-minute interval
            "days": ("1mo", "1d"),     # Last month, 1-day interval
            "months": ("1y", "1wk"),   # Last year, 1-week interval
            "years": ("5y", "1mo")     # Last 5 years, 1-month interval
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

        # Prepare OHLC data for candlestick chart (date, open, high, low, close)
        candle_data = []
        for index, row in hist.iterrows():
            candle_data.append({
                "x": row.name.strftime('%Y-%m-%d'),  
                "o": float(row['Open']),  
                "h": float(row['High']),  
                "l": float(row['Low']),   
                "c": float(row['Close']),
            })

        return jsonify({"labels": labels, "data": data, "candleData": candle_data}), 200

    except Exception as e:
        return jsonify({
            "message": "Error generating stock data.",
            "error": str(e)
        }), 500


@app.route("/autocomplete", methods=["GET"])
def autocomplete():
    """
    Fetch up to 5 stock ticker suggestions using predefined data first, 
    then fallback to yfinance if no matches are found.
    """
    query = request.args.get("query", "").upper()
    if not query:
        return jsonify({"suggestions": []})

    try:
        # Filter predefined tickers by query
        predefined_matches = [
            ticker for ticker in PREDEFINED_TICKERS
            if query in ticker["symbol"]
        ][:5]

        # If matches are found in predefined, return them
        if predefined_matches:
            return jsonify({"suggestions": predefined_matches})

        # Fallback: Fetch matching tickers from yfinance
        stock_list = yf.Tickers(query)  # Retrieve tickers matching query
        tickers = list(stock_list.tickers.keys())

        # Get details for the first 5 matches dynamically
        dynamic_matches = []
        for ticker in tickers[:5]:
            stock_info = yf.Ticker(ticker).info
            dynamic_matches.append({
                "symbol": ticker,
                "name": stock_info.get("shortName", "Unknown")
            })

        return jsonify({"suggestions": dynamic_matches})
    except Exception as e:
        return jsonify({"error": str(e), "message": "Error fetching stock suggestions"}), 500


@app.route("/top-gainers", methods=["GET"])
def top_gainers():
    pass
    # try:
    #     # Fetch the top gainers
    #     gainers = si.get_day_gainers().head(3)  # Get top 3 gainers

    #     # Prepare the data
    #     top_gainers_list = []
    #     for index, row in gainers.iterrows():
    #         symbol = row['Symbol']
    #         name = row['Name']
    #         price = row['Price (Intraday)']
    #         change = row['% Change']
    #         high = row['Day\'s Range'].split(' - ')[1]
    #         low = row['Day\'s Range'].split(' - ')[0]

    #         top_gainers_list.append({
    #             "symbol": symbol,
    #             "name": name,
    #             "price": price,
    #             "percentChange": change,
    #             "high": high,
    #             "low": low
    #         })

    #     return jsonify(top_gainers_list)
    # except Exception as e:
    #     return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
