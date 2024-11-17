from flask import Flask
from flask_cors import CORS
from flask_session import Session

app = Flask(__name__)
app.secret_key = 'a2ea490452f07b815f2ee39eaab6d1fc519cc2144d34d312535a27a20109e955'

app.config["SESSION_TYPE"] = "filesystem"  # Store sessions on the file system
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
Session(app)

CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)


