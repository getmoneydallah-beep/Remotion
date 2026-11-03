"""Nano Banana (Gemini image) helper. Usage: nano_image.py <model> <prompt_file> <out.png> [ref_image ...]"""
import base64, json, os, sys, urllib.request
model, prompt_file, out = sys.argv[1], sys.argv[2], sys.argv[3]
parts = [{"text": open(prompt_file, encoding="utf-8").read()}]
for ref in sys.argv[4:]:
    parts.append({"inlineData": {"mimeType": "image/jpeg" if ref.lower().endswith((".jpg", ".jpeg")) else "image/png", "data": base64.b64encode(open(ref, "rb").read()).decode()}})
body = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}}
req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", data=json.dumps(body).encode(),
                             headers={"Content-Type": "application/json", "x-goog-api-key": os.environ["geminikey"]})
try:
    d = json.load(urllib.request.urlopen(req, timeout=300))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:500]); sys.exit(1)
for p in d["candidates"][0]["content"]["parts"]:
    if "inlineData" in p:
        open(out, "wb").write(base64.b64decode(p["inlineData"]["data"])); print("saved", out, p["inlineData"]["mimeType"]); break
    elif "text" in p:
        print("text:", p["text"][:300])
