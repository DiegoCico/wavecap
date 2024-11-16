from flask import Flask, jsonify, request
import requests
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

# Access environment variables
PINATA_API_KEY = os.getenv('PINATA_API_KEY')
PINATA_API_SECRET = os.getenv('PINATA_API_SECRET')

@app.route("/server-test", methods=['POST'])
def server_test():
    return jsonify({'message': 'Server OK'})

@app.route("/signup", methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Validate input
    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 400

    # Create IPFS account metadata on Pinata
    metadata = {
        "name": email,
        "keyvalues": {
            "email": email,
        }
    }
    
    files = {
        'pinataMetadata': (None, str(metadata)),
        'pinataContent': (None, password)  # Store password for simplicity; encrypt in production
    }

    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_API_SECRET
    }

    try:
        pinata_response = requests.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", headers=headers, files=files)
        pinata_response.raise_for_status()
        response_data = pinata_response.json()
        return jsonify({'message': 'Account created successfully!', 'ipfs_hash': response_data['IpfsHash']}), 201
    except requests.exceptions.RequestException as e:
        return jsonify({'message': 'Failed to create account on Pinata.', 'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
