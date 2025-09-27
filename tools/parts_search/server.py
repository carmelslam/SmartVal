from flask import Flask, request, jsonify
import tempfile, os, requests
try:
    from tools.parts_search import parser
    HAVE_PARSER = hasattr(parser, "parse_pdf")
except Exception:
    parser = None
    HAVE_PARSER = False

app = Flask(__name__)

@app.post("/ingest")
def ingest():
    data = request.get_json(force=True) or {}
    pdf_url = data.get("pdf_url")
    if not pdf_url:
        return jsonify(ok=False, error="pdf_url required"), 400
    with tempfile.TemporaryDirectory() as td:
        fp = os.path.join(td, "input.pdf")
        r = requests.get(pdf_url, timeout=30)
        r.raise_for_status()
        with open(fp, "wb") as f: f.write(r.content)
        result = parser.parse_pdf(fp) if HAVE_PARSER else {"note": "stub", "file": os.path.basename(fp)}
    return jsonify(ok=True, result=result)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port)
