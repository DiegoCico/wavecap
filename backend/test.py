# from requests_html import HTMLSession

# try:
#     session = HTMLSession()
#     response = session.get("https://finance.yahoo.com/")
#     print("HTMLSession is working")
#     print(response.html)
# except Exception as e:
#     print(f"Error with HTMLSession: {e}")

# from yahoo_fin import stock_info as si

# try:
#     gainers = si.get_day_gainers()
#     print(gainers.head())  # Check if data is fetched successfully
# except Exception as e:
#     print(f"Error fetching gainers: {e}")

from yahoo_fin import stock_info as si

try:
    gainers = si.get_day_gainers()
    
    # Inspect available columns
    print("Available Columns:", gainers.columns)
    
    # top_gainers_list = []
    # for index, row in gainers.head(3).iterrows():
    #     symbol = row.get('Symbol', 'N/A')
    #     name = row.get('Name', 'N/A')
    #     price = row.get('Price (Intraday)', 'N/A')
    #     change = row.get('% Change', 'N/A')
    #     day_range = row.get('Day\'s Range', 'N/A')  # Check if this column exists

    #     # If 'Day\'s Range' exists, split it safely
    #     if isinstance(day_range, str) and ' - ' in day_range:
    #         low, high = day_range.split(' - ')
    #     else:
    #         low, high = None, None

    #     top_gainers_list.append({
    #         "symbol": symbol,
    #         "name": name,
    #         "price": price,
    #         "percentChange": change,
    #         "high": high,
    #         "low": low
    #     })

    # print("Top Gainers:", top_gainers_list)
except Exception as e:
    print(f"Error fetching gainers: {e}")

# import yfinance as yf

# # Example symbols
# symbols = ["AAPL", "MSFT", "TSLA"]

# for symbol in symbols:
#     stock = yf.Ticker(symbol)
#     print(f"Symbol: {symbol}, Current Price: {stock.history(period='1d')['Close'][-1]}")

