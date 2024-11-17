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
from datetime import datetime
import alpaca_trade_api as tradeapi
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

ALPACA_BASE_URL = 'https://paper-api.alpaca.markets/v2'
# alpaca = tradeapi.REST(os.getenv('ALPACA_API_KEY'), os.getenv('ALPACA_SECRET_KEY'), ALPACA_BASE_URL)

NEWS_API_KEY = os.getenv("NEWS_API")
analyzer = SentimentIntensityAnalyzer()
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

        # Fetching historical data for additional metrics
        hist = stock.history(period="1d")  # Get today's data
        if hist.empty:
            return jsonify({"error": "No historical data available for this stock"}), 404

        # Fetch key metrics from summary_detail
        summary_detail = stock.get_info()
        
        stock_details = {
            "stockName": summary_detail.get("shortName", "Unknown Stock"),
            "currentPrice": hist["Close"][-1] if not hist.empty else "N/A",  # Use the latest close price
            "marketCap": summary_detail.get("marketCap", "N/A"),
            "sector": summary_detail.get("sector", "N/A"),
            "industry": summary_detail.get("industry", "N/A"),
            "volume": hist["Volume"][-1] if not hist.empty else "N/A",
            "highToday": hist["High"][-1] if not hist.empty else "N/A",
            "lowToday": hist["Low"][-1] if not hist.empty else "N/A",
            "dividendYield": summary_detail.get("dividendYield", "N/A"),
            "yearHigh": summary_detail.get("fiftyTwoWeekHigh", "N/A"),
            "yearLow": summary_detail.get("fiftyTwoWeekLow", "N/A"),
            "eps": summary_detail.get("trailingEps", "N/A"),
        }

        return jsonify(stock_details), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch stock details", "message": str(e)}), 500




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

@app.route("/remove-stock", methods=["POST"])
def remove_stock():
    """
    Remove a stock from the user's portfolio in Firestore.
    """
    try:
        data = request.json
        uid = data.get("uid")
        stock_symbol = data.get("symbol")

        if not uid or not stock_symbol:
            return jsonify({"error": "UID and stock symbol are required"}), 400

        # Reference the user's portfolio collection
        portfolio_ref = db.collection("users").document(uid).collection("portfolio")

        # Query the stock document by its symbol
        query = portfolio_ref.where("symbol", "==", stock_symbol).limit(1).stream()

        stock_doc = next(query, None)  # Get the first matching document
        if not stock_doc:
            return jsonify({"error": f"Stock {stock_symbol} not found in portfolio"}), 404

        # Delete the stock document
        portfolio_ref.document(stock_doc.id).delete()

        return jsonify({"message": f"Stock {stock_symbol} removed successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to remove stock: {str(e)}"}), 500

@app.route("/get-portfolio", methods=["GET"])
def get_portfolio():
    """
    Fetch the list of all stock symbols and names in the user's portfolio.
    """
    try:
        uid = request.args.get("uid")  # Extract UID from query parameters

        if not uid:
            return jsonify({"error": "UID is required to fetch portfolio"}), 400

        # Reference the user's portfolio collection
        portfolio_ref = db.collection("users").document(uid).collection("portfolio")

        # Fetch all documents in the portfolio collection
        portfolio_docs = portfolio_ref.stream()

        # Extract and filter out placeholder documents
        portfolio_items = [
            {"symbol": doc_data.get("symbol"), "name": doc_data.get("name")}
            for doc in portfolio_docs
            if (doc_data := doc.to_dict()).get("symbol") and not doc_data.get("placeholder")
        ]

        if not portfolio_items:
            return jsonify({
                "message": "No stocks found in portfolio",
                "portfolio": []
            }), 200

        return jsonify({
            "portfolio": portfolio_items
        }), 200

    except Exception as e:
        return jsonify({
            "error": f"Failed to fetch portfolio: {str(e)}"
        }), 500




@app.route("/save-stock", methods=["POST"])
def save_stock():
    """
    Save a stock to the user's portfolio in Firestore. 
    Creates a portfolio collection if it doesn't exist.
    """
    try:
        data = request.json
        uid = data.get("uid")
        stock_symbol = data.get("symbol")
        stock_name = data.get("name")

        if not uid or not stock_symbol or not stock_name:
            return jsonify({"error": "UID, stock symbol, and name are required"}), 400

        # Reference the user's portfolio collection
        portfolio_ref = db.collection("users").document(uid).collection("portfolio")

        # Check if the portfolio collection is empty
        docs = portfolio_ref.limit(1).stream()
        if not any(docs):
            # Add a placeholder document to initialize the portfolio collection
            portfolio_ref.add({"placeholder": True})

        # Save the stock to the portfolio collection
        portfolio_ref.add({
            "symbol": stock_symbol,
            "name": stock_name
        })

        return jsonify({"message": f"Stock {stock_symbol} saved successfully"}), 200

    except firestore.NotFound:
        return jsonify({"error": "User document not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to save stock: {str(e)}"}), 500


def set_starting_balance(starting_balance):
    try:
        # Headers for authentication
        headers = {
            'APCA-API-KEY-ID': os.getenv("ALPACA_API_KEY"),
            'APCA-API-SECRET-KEY': os.getenv("ALPACA_SECRET_KEY")
        }

        # Fetch current account details
        account_response = requests.get(f'{ALPACA_BASE_URL}/account', headers=headers)
        account_response.raise_for_status()
        account_data = account_response.json()
        print("Current account details:", account_data)

        # Update cash balance (paper trading only)
        patch_response = requests.patch(
            f'{ALPACA_BASE_URL}/account',
            headers=headers,
            json={'cash': starting_balance}
        )
        patch_response.raise_for_status()
        updated_account = patch_response.json()
        print("Updated account details:", updated_account)

        return updated_account

    except requests.exceptions.RequestException as e:
        print("Error updating account balance:", e)
        return None


@app.route("/create-new-simulation", methods=['OPTIONS', 'POST'])
def new_simulation():
    if request.method == 'OPTIONS':
        # Handle preflight CORS request
        response = make_response()
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 200
    try:
        data = request.json
        uid = data.get('uid')
        sim_name = data.get('name')
        starting_balance = data.get('startingBalance')
        starting_ticker = data.get('startingTicker')

        if not uid or not sim_name or not starting_balance:
            return jsonify({'error': 'Missing required fields'}), 400

        # Add the simulation to Firebase
        now = datetime.now()
        date_opened = {'day': now.day, 'month': now.month, 'year': now.year}
        simulation = {
            'name': sim_name,
            'dateOpened': date_opened,
            'profitLoss': 0,
            'startingBalance': starting_balance,
            'currentBalance': starting_balance,
            'winRate': 0,
            'startingTicker': starting_ticker,
            'simulatedCash': starting_balance  # Local simulated balance
        }
        sims_ref = db.collection('users').document(uid).collection('sims')
        sims_ref.add(simulation)

        # Fetch Alpaca account details to ensure integration
        headers = {
            'APCA-API-KEY-ID': os.getenv('ALPACA_API_KEY'),
            'APCA-API-SECRET-KEY': os.getenv('ALPACA_SECRET_KEY')
        }
        account_response = requests.get(f'{ALPACA_BASE_URL}/account', headers=headers)
        if account_response.status_code != 200:
            return jsonify({'error': 'Failed to fetch Alpaca account'}), 500

        # Respond with simulation creation success
        return jsonify({'message': 'Simulation created successfully', 'simulation': simulation}), 200

    except Exception as e:
        return jsonify({'error': f'Error creating simulation: {str(e)}'}), 500


@app.route('/place-order', methods=['OPTIONS', 'POST'])
def place_order():
    if request.method == 'OPTIONS':
        # Handle preflight CORS request
        response = make_response()
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 200

    try:
        data = request.json
        ticker = data.get('ticker')
        dollar_amount = float(data.get('dollarAmount'))
        order_type = data.get('orderType', 'market')  # Default to market order
        time_in_force = data.get('timeInForce', 'gtc')  # Default to 'Good Till Cancelled'
        side = data.get('side', 'buy')  # Default to 'buy'

        if not ticker or not dollar_amount or not side:
            return jsonify({'error': 'Missing required fields'}), 400

        # Alpaca API headers
        headers = {
            'APCA-API-KEY-ID': os.getenv('ALPACA_API_KEY'),
            'APCA-API-SECRET-KEY': os.getenv('ALPACA_SECRET_KEY')
        }

        # Step 1: Fetch the latest quote price
        market_data_response = requests.get(
            f'{ALPACA_BASE_URL}/v2/stocks/{ticker}/quotes/latest',
            headers=headers
        )

        if market_data_response.status_code == 200:
            # Market is open, use the latest quote price
            market_data = market_data_response.json()
            last_price = float(market_data['ask_price'] or market_data['bid_price'])  # Use ask or bid price
        else:
            # Step 2: Fetch the last trade price as a fallback
            trade_data_response = requests.get(
                f'{ALPACA_BASE_URL}/v2/stocks/{ticker}/trades/latest',
                headers=headers
            )
            if trade_data_response.status_code == 200:
                # Market is closed, use the last trade price
                trade_data = trade_data_response.json()
                last_price = float(trade_data['price'])
            else:
                # Failed to fetch both quote and trade data
                return jsonify({'error': 'Failed to fetch market or trade data. The market might be closed.'}), 400

        # Step 3: Calculate the number of shares
        number_of_shares = round(dollar_amount / last_price, 2)

        # Step 4: Place the order
        order_data = {
            'symbol': ticker,
            'qty': number_of_shares,
            'side': side,
            'type': order_type,
            'time_in_force': time_in_force
        }

        order_response = requests.post(
            f'{ALPACA_BASE_URL}/v2/orders',
            headers=headers,
            json=order_data
        )

        if order_response.status_code == 200:
            # Order successfully placed
            order_result = order_response.json()
            return jsonify({'message': 'Order placed successfully', 'order': order_result}), 200
        else:
            # Failed to place the order
            return jsonify({'error': 'Failed to place order'}), 500

    except Exception as e:
        return jsonify({'error': f'Error placing order: {str(e)}'}), 500





@app.route("/news-sentiment/<company_name>", methods=["GET"])
def get_news_sentiment(company_name):
    """
    Fetch recent news articles about a company and perform sentiment analysis.
    """
    try:
        if not NEWS_API_KEY:
            return jsonify({"error": "News API key not configured."}), 500

        url = "https://newsapi.org/v2/everything"
        params = {
            "q": company_name,
            "apiKey": NEWS_API_KEY,
            "language": "en",
            "sortBy": "publishedAt",
        }

        # Make API request
        response = requests.get(url, params=params)
        if response.status_code != 200:
            return jsonify({
                "error": "Failed to fetch news articles.",
                "details": response.json()
            }), response.status_code

        articles = response.json().get("articles", [])
        if not articles:
            return jsonify({"error": "No articles found."}), 404

        # Analyze sentiment for each article
        sentiment_results = []
        for article in articles:
            title = article.get("title", "")
            description = article.get("description", "")
            content = f"{title}. {description}"
            sentiment_score = analyzer.polarity_scores(content)

            sentiment_results.append({
                "date": article.get("publishedAt"),
                "title": title,
                "description": description,
                "sentiment": sentiment_score,
            })

        # Format data for the chart
        labels = [item["date"] for item in sentiment_results]
        scores = [item["sentiment"]["compound"] for item in sentiment_results]

        return jsonify({"labels": labels, "scores": scores}), 200

    except Exception as e:
        return jsonify({"error": str(e), "message": "Failed to fetch sentiment data."}), 500
   




if __name__ == "__main__":
    app.run(debug=True)
