import requests

url = "https://openrouter.ai/api/v1/embeddings"
headers = {
  "Authorization": "Bearer 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",
  "Content-Type": "application/json"
}
data = {
  "model": "nvidia/llama-nemotron-embed-vl-1b-v2:free",
  "input": "test request"
}

response = requests.post(url, headers=headers, json=data, verify=False)
print("Status:", response.status_code)
res_json = response.json()
if "data" in res_json and len(res_json["data"]) > 0:
    print("Embedding Size:", len(res_json["data"][0]["embedding"]))
else:
    print(res_json)
