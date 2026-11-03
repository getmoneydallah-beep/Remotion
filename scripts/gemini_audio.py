"""Gemini TTS + Lyria helpers. Reads the API key from $geminikey (never printed)."""
import base64, json, os, sys, urllib.request, wave

KEY = os.environ["geminikey"]
BASE = "https://generativelanguage.googleapis.com/v1beta/models"

def call(model, body):
    req = urllib.request.Request(f"{BASE}/{model}:generateContent", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:600]); sys.exit(1)

def tts(model, voice, text, out):
    d = call(model, {"contents": [{"parts": [{"text": text}]}],
                     "generationConfig": {"responseModalities": ["AUDIO"],
                                          "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}})
    part = d["candidates"][0]["content"]["parts"][0]["inlineData"]
    pcm = base64.b64decode(part["data"])
    rate = 24000
    mt = part.get("mimeType", "")
    if "rate=" in mt: rate = int(mt.split("rate=")[1].split(";")[0])
    if pcm[:4] == b"RIFF":
        open(out, "wb").write(pcm)
    else:
        with wave.open(out, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
    with wave.open(out) as w:
        print(out, f"{w.getnframes()/w.getframerate():.1f}s", w.getframerate(), "Hz", mt)

def music(model, prompt, out_base):
    d = call(model, {"contents": [{"parts": [{"text": prompt}]}]})
    n = 0
    for c in d.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            if "inlineData" in p:
                mt = p["inlineData"]["mimeType"]; ext = "mp3" if "mpeg" in mt or "mp3" in mt else "wav"
                path = f"{out_base}.{ext}"
                open(path, "wb").write(base64.b64decode(p["inlineData"]["data"])); n += 1
                print(path, mt)
            elif "text" in p:
                print("text:", p["text"][:300])
    if not n: print(json.dumps(d)[:800])

def transcribe(path):
    data = base64.b64encode(open(path, "rb").read()).decode()
    d = call("gemini-2.5-flash", {"contents": [{"parts": [
        {"inlineData": {"mimeType": "audio/wav", "data": data}},
        {"text": "Transcribe this Arabic audio exactly, word for word, with timestamps (mm:ss) at the start of each sentence. Then in one English line rate the accent: is it Saudi/Gulf, Egyptian, Levantine, or Modern Standard Arabic? Note any mispronunciations."}]}]})
    print(d["candidates"][0]["content"]["parts"][0]["text"])

def describe(path, mime):
    data = base64.b64encode(open(path, "rb").read()).decode()
    d = call("gemini-2.5-flash", {"contents": [{"parts": [
        {"inlineData": {"mimeType": mime, "data": data}},
        {"text": "You are a music supervisor. Describe this instrumental second by second in sections (timestamps), instruments, mood, tempo, where the emotional peak is, and whether it sounds like a premium cinematic brand film score or generic stock music. Be critical and concise (max 150 words)."}]}]})
    print(d["candidates"][0]["content"]["parts"][0]["text"])

if __name__ == "__main__":
    if sys.argv[1] == "transcribe": transcribe(sys.argv[2])
    if sys.argv[1] == "describe": describe(sys.argv[2], sys.argv[3])
    cmd = sys.argv[1]
    if cmd == "tts": tts(sys.argv[2], sys.argv[3], open(sys.argv[4], encoding="utf-8").read(), sys.argv[5])
    if cmd == "music": music(sys.argv[2], open(sys.argv[3], encoding="utf-8").read(), sys.argv[4])
