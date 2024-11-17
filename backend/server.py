from flask import jsonify, request, session, make_response, Flask
import firebase_admin
from firebase_admin import credentials, auth, firestore
from dotenv import load_dotenv
import os
import requests
from config import app, PREDEFINED_TICKERS
import yfinance as yf
import json
from yahoo_fin import stock_info as si
from sambanova_client import sambanova_client



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

NEWS_API_KEY = os.getenv("NEWSDATA_API")

SAMBANOVA_API_URL = "https://api.sambanova.ai/v1/chat/completions"
SAMBANOVA_API_KEY = os.getenv("SAMVANOVA_API")
if not SAMBANOVA_API_KEY:
    raise ValueError("SAMBANOVA_API_KEY environment variable not set.")


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
    try:
        # Fetch the top gainers
        gainers = si.get_day_gainers().head(3)  # Get top 3 gainers

        # Prepare the data
        top_gainers_list = []
        for index, row in gainers.iterrows():
            symbol = row['Symbol']
            name = row['Name']
            price = row['Price (Intraday)']
            change = row['% Change']
            high = row['Day\'s Range'].split(' - ')[1]
            low = row['Day\'s Range'].split(' - ')[0]

            top_gainers_list.append({
                "symbol": symbol,
                "name": name,
                "price": price,
                "percentChange": change,
                "high": high,
                "low": low
            })

        return jsonify(top_gainers_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/stock-name/<stock_symbol>", methods=["GET"])
def get_stock_details(stock_symbol):
    try:
        stock = yf.Ticker(stock_symbol)

        # Try to get stock info
        stock_info = stock.info
        if not stock_info:
            return Response(
                json.dumps({"error": "No data found for this stock symbol"}), 
                status=404, 
                mimetype='application/json'
            )

        stock_details = {
            "stockName": stock_info.get("shortName", "Unknown Stock"),
            "currentPrice": stock_info.get("currentPrice", "N/A"),
            "marketCap": stock_info.get("marketCap", "N/A"),
            "sector": stock_info.get("sector", "N/A"),
            "industry": stock_info.get("industry", "N/A"),
            "volume": stock_info.get("volume", "N/A"),
            "highToday": stock_info.get("dayHigh", "N/A"),
            "lowToday": stock_info.get("dayLow", "N/A"),
        }

        return Response(
            json.dumps(stock_details), 
            status=200, 
            mimetype='application/json'
        )

    except Exception as e:
        # Log the error for debugging
        print(f"Error: {e}")
        error_response = {
            "error": "Failed to fetch stock details",
            "message": str(e)
        }
        return Response(
            json.dumps(error_response), 
            status=500, 
            mimetype='application/json'
        )

@app.route("/news/<company_name>", methods=["GET"])
def get_company_news(company_name):
    """
    Fetch recent news about a specific company using the NewsData.io API.
    """
    try:
        # Base URL for NewsData.io
        url = "https://newsdata.io/api/1/news"

        # Query parameters
        params = {
            "apikey": NEWS_API_KEY,
            "q": company_name,  # Search for the company name
            "language": "en",  # Fetch only English articles
        }

        # Make a GET request to NewsData.io
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise exception for HTTP errors

        # Parse the JSON response
        news_data = response.json()

        # Extract relevant information from articles
        articles = news_data.get("results", [])
        news_items = [
            {
                "title": article["title"],
                "description": article["description"],
                "link": article["link"],
                "source": article["source_id"],
                "published": article["pubDate"],
            }
            for article in articles
        ]

        return jsonify({"news": news_items}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/fetch-user-sims", methods=['OPTIONS', 'POST'])
def fetch_user_sims():
    try:
        data = request.json
        uid = data.get('uid')
        sims = []
        sims_ref = db.collection('users').document(uid).collection('sims')
        docs = sims_ref.stream()
        for doc in docs:
            sims.append({
                'id':doc.id,
                **doc.to_dict(),
            })

        return jsonify({'message':'Sims fetched successfully', 'sims':sims})
    except Exception as e:
        return jsonify({'error':f'Error fetching sims from user Error: {str(e)}'})


@app.route("/sambanova-investment-chat", methods=["POST"])
def sambanova_investment_chat():
    """
    Interact with SambaNova's Chat API to provide investment-focused insights.
    """
    user_input = request.json.get("message")
    if not user_input:
        return jsonify({"error": "Message is required"}), 400

    try:
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an AI assistant specializing in investments and financial insights. "
                    "You provide detailed and accurate information about stock market trends, "
                    "company earnings, investment strategies, portfolio management, and other financial queries. "
                    "You prioritize clarity, accuracy, and actionable advice."
                )
            },
            {"role": "user", "content": user_input}
        ]

        # Use the SambaNova client to create a chat completion
        response = sambanova_client.chat_completions_create(
            model="Meta-Llama-3.1-8B-Instruct",
            messages=messages,
            temperature=0.5,
            top_p=0.1,
            max_tokens=300
        )

        # Extract the assistant's reply
        reply = response["choices"][0]["message"]["content"]
        return jsonify({"response": reply}), 200

    except Exception as e:
        return jsonify({"error": str(e), "message": "Failed to process the request"}), 500

@app.route("/save-stock", methods=["POST"])
def save_stock():
    """
    Save a stock to the user's portfolio in Firestore.
    """
    try:
        data = request.json
        uid = data.get("uid")
        stock_symbol = data.get("symbol")
        stock_name = data.get("name")

        if not uid or not stock_symbol or not stock_name:
            return jsonify({"error": "UID, stock symbol, and name are required"}), 400

        user_doc_ref = db.collection("users").document(uid)
        user_doc_ref.update({
            "saved": firestore.ArrayUnion([{"symbol": stock_symbol, "name": stock_name}])
        })

        return jsonify({"message": f"Stock {stock_symbol} saved successfully"}), 200

    except firestore.NotFound:
        return jsonify({"error": "User document not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to save stock: {str(e)}"}), 500



if __name__ == "__main__":
    app.run(debug=True)
