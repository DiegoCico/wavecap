import os
import requests

class SambaNovaClient:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url

    def chat_completions_create(self, model, messages, temperature=0.1, top_p=0.1, max_tokens=300):
        """
        Interact with the SambaNova Chat API to generate responses.
        """
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "top_p": top_p,
            "max_tokens": max_tokens
        }
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()


sambanova_client = SambaNovaClient(
    api_key=os.environ.get("SAMVANOVA_API"),
    base_url="https://api.sambanova.ai/v1",
)
