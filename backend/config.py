from flask import Flask
from flask_cors import CORS
from flask_session import Session
import os

app = Flask(__name__)
app.secret_key = "a2ea490452f07b815f2ee39eaab6d1fc519cc2144d34d312535a27a20109e955"

CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://diegocico.github.io"]}}, supports_credentials=True)


PREDEFINED_TICKERS = [
    {"symbol": "AAPL", "name": "Apple Inc."},
    {"symbol": "MSFT", "name": "Microsoft Corporation"},
    {"symbol": "GOOGL", "name": "Alphabet Inc."},
    {"symbol": "AMZN", "name": "Amazon.com Inc."},
    {"symbol": "TSLA", "name": "Tesla Inc."},
    {"symbol": "NVDA", "name": "NVIDIA Corporation"},
    {"symbol": "FB", "name": "Meta Platforms Inc."},
    {"symbol": "BRK.B", "name": "Berkshire Hathaway Inc."},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co."},
    {"symbol": "V", "name": "Visa Inc."},
    {"symbol": "JNJ", "name": "Johnson & Johnson"},
    {"symbol": "WMT", "name": "Walmart Inc."},
    {"symbol": "PG", "name": "Procter & Gamble Co."},
    {"symbol": "DIS", "name": "The Walt Disney Company"},
    {"symbol": "MA", "name": "Mastercard Incorporated"},
    {"symbol": "HD", "name": "The Home Depot, Inc."},
    {"symbol": "NFLX", "name": "Netflix Inc."},
    {"symbol": "PYPL", "name": "PayPal Holdings Inc."},
    {"symbol": "ADBE", "name": "Adobe Inc."},
    {"symbol": "INTC", "name": "Intel Corporation"},
    {"symbol": "CMCSA", "name": "Comcast Corporation"},
    {"symbol": "XOM", "name": "Exxon Mobil Corporation"},
    {"symbol": "PEP", "name": "PepsiCo Inc."},
    {"symbol": "KO", "name": "The Coca-Cola Company"},
    {"symbol": "CSCO", "name": "Cisco Systems, Inc."},
    {"symbol": "BA", "name": "The Boeing Company"},
    {"symbol": "PFE", "name": "Pfizer Inc."},
    {"symbol": "T", "name": "AT&T Inc."},
    {"symbol": "COST", "name": "Costco Wholesale Corporation"},
    {"symbol": "NKE", "name": "Nike, Inc."},
    {"symbol": "ABBV", "name": "AbbVie Inc."},
    {"symbol": "MRK", "name": "Merck & Co., Inc."},
    {"symbol": "ORCL", "name": "Oracle Corporation"},
    {"symbol": "AMGN", "name": "Amgen Inc."},
    {"symbol": "MDT", "name": "Medtronic plc"},
    {"symbol": "UNH", "name": "UnitedHealth Group Incorporated"},
    {"symbol": "CRM", "name": "Salesforce, Inc."},
    {"symbol": "CVX", "name": "Chevron Corporation"},
    {"symbol": "MCD", "name": "McDonald's Corporation"},
    {"symbol": "WFC", "name": "Wells Fargo & Company"},
    {"symbol": "BKNG", "name": "Booking Holdings Inc."},
    {"symbol": "TXN", "name": "Texas Instruments Incorporated"},
    {"symbol": "HON", "name": "Honeywell International Inc."},
    {"symbol": "QCOM", "name": "QUALCOMM Incorporated"},
    {"symbol": "UPS", "name": "United Parcel Service, Inc."},
    {"symbol": "GS", "name": "The Goldman Sachs Group, Inc."},
    {"symbol": "MS", "name": "Morgan Stanley"},
    {"symbol": "IBM", "name": "International Business Machines Corporation"},
    {"symbol": "BLK", "name": "BlackRock, Inc."},
    {"symbol": "ABT", "name": "Abbott Laboratories"},
    {"symbol": "LMT", "name": "Lockheed Martin Corporation"},
    {"symbol": "CAT", "name": "Caterpillar Inc."},
    {"symbol": "LOW", "name": "Lowe's Companies, Inc."},
    {"symbol": "GE", "name": "General Electric Company"},
    {"symbol": "MMM", "name": "3M Company"},
    {"symbol": "AXP", "name": "American Express Company"},
    {"symbol": "TMO", "name": "Thermo Fisher Scientific Inc."},
    {"symbol": "CVS", "name": "CVS Health Corporation"},
    {"symbol": "DHR", "name": "Danaher Corporation"},
    {"symbol": "SCHW", "name": "The Charles Schwab Corporation"},
    {"symbol": "RTX", "name": "Raytheon Technologies Corporation"},
    {"symbol": "ADP", "name": "Automatic Data Processing, Inc."},
    {"symbol": "C", "name": "Citigroup Inc."},
    {"symbol": "ISRG", "name": "Intuitive Surgical, Inc."},
    {"symbol": "NOW", "name": "ServiceNow, Inc."},
    {"symbol": "SPGI", "name": "S&P Global Inc."},
    {"symbol": "PLD", "name": "Prologis, Inc."},
    {"symbol": "ANTM", "name": "Anthem, Inc."},
    {"symbol": "EL", "name": "The Estée Lauder Companies Inc."},
    {"symbol": "MO", "name": "Altria Group, Inc."},
    {"symbol": "GILD", "name": "Gilead Sciences, Inc."},
    {"symbol": "CL", "name": "Colgate-Palmolive Company"},
    {"symbol": "DUK", "name": "Duke Energy Corporation"},
    {"symbol": "BMY", "name": "Bristol-Myers Squibb Company"},
    {"symbol": "SO", "name": "The Southern Company"},
    {"symbol": "ATVI", "name": "Activision Blizzard, Inc."},
    {"symbol": "GM", "name": "General Motors Company"},
    {"symbol": "F", "name": "Ford Motor Company"},
    {"symbol": "TWTR", "name": "Twitter, Inc."},
    {"symbol": "EBAY", "name": "eBay Inc."},
    {"symbol": "ROST", "name": "Ross Stores, Inc."},
    {"symbol": "KMB", "name": "Kimberly-Clark Corporation"},
    {"symbol": "ECL", "name": "Ecolab Inc."},
    {"symbol": "CHTR", "name": "Charter Communications, Inc."},
    {"symbol": "MDLZ", "name": "Mondelez International, Inc."},
    {"symbol": "LRCX", "name": "Lam Research Corporation"},
    {"symbol": "MU", "name": "Micron Technology, Inc."},
    {"symbol": "SBUX", "name": "Starbucks Corporation"},
    {"symbol": "SNPS", "name": "Synopsys, Inc."},
    {"symbol": "FDX", "name": "FedEx Corporation"},
    {"symbol": "KLAC", "name": "KLA Corporation"},
    {"symbol": "DAL", "name": "Delta Air Lines, Inc."},
    {"symbol": "UAL", "name": "United Airlines Holdings, Inc."},
    {"symbol": "AAL", "name": "American Airlines Group Inc."}
]



