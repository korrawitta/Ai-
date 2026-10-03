"""
Wealth Sense backend — thin Flask wrapper around yfinance.

Endpoints:
  GET /api/quotes?symbols=PTT.BK,AAPL,BTC-USD
      -> latest close, previous close, and % change for each symbol

  GET /api/history/<symbol>?range=1mo&interval=1d
      -> OHLCV candles for charting (range/interval follow yfinance's
         own period/interval strings, e.g. range=5d&interval=15m)

  GET /api/levels/<symbol>
      -> classic pivot-point support/resistance levels calculated from
         the most recent completed trading day (pivot, r1, r2, s1, s2)python app.py

Notes:
  - Yahoo Finance tickers: SET-listed stocks use a ".BK" suffix
    (e.g. "PTT.BK"), crypto uses "-USD" pairs (e.g. "BTC-USD").
  - yfinance pulls data from Yahoo Finance's public endpoints. It is
    fine for prototyping but has no official uptime/rate-limit
    guarantees — swap in a paid market-data provider for production.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()  # reads backend/.env if it exists (SMTP credentials, etc.)

app = Flask(__name__)
CORS(app)  # allow the Vite dev server (different port) to call this API

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.environ.get("SMTP_FROM_EMAIL", SMTP_USERNAME)


def _get_last_two_closes(symbol: str):
    """Return (last_close, previous_close) using daily history, which is
    more stable across yfinance versions than the fast_info shortcuts."""
    hist = yf.Ticker(symbol).history(period="5d", interval="1d")
    if hist.empty:
        raise ValueError(f"no price data for '{symbol}'")
    last_close = float(hist["Close"].iloc[-1])
    previous_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else last_close
    return last_close, previous_close


@app.get("/api/quotes")
def get_quotes():
    symbols_param = request.args.get("symbols", "")
    symbols = [s.strip() for s in symbols_param.split(",") if s.strip()]
    if not symbols:
        return jsonify({"error": "pass at least one symbol, e.g. ?symbols=AAPL,PTT.BK"}), 400

    results = []
    for symbol in symbols:
        try:
            last_close, previous_close = _get_last_two_closes(symbol)
            change_percent = (
                (last_close - previous_close) / previous_close * 100
                if previous_close
                else 0.0
            )
            results.append(
                {
                    "symbol": symbol,
                    "price": round(last_close, 2),
                    "previous_close": round(previous_close, 2),
                    "change_percent": round(change_percent, 2),
                }
            )
        except Exception as exc:  # keep going even if one symbol fails
            results.append({"symbol": symbol, "error": str(exc)})

    return jsonify(results)


@app.get("/api/history/<path:symbol>")
def get_history(symbol):
    range_ = request.args.get("range", "1mo")
    interval = request.args.get("interval", "1d")
    try:
        hist = yf.Ticker(symbol).history(period=range_, interval=interval)
        data = [
            {
                "date": idx.isoformat(),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if row["Volume"] == row["Volume"] else 0,
            }
            for idx, row in hist.iterrows()
        ]
        return jsonify(data)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/levels/<path:symbol>")
def get_levels(symbol):
    """Classic pivot points (pivot, R1/R2, S1/S2) from the last completed
    trading day's OHLC. This is a simple, widely-used technical-analysis
    formula — not a prediction, just a reference for likely reaction
    zones around the current price."""
    try:
        hist = yf.Ticker(symbol).history(period="5d", interval="1d")
        if hist.empty:
            return jsonify({"error": f"no price data for '{symbol}'"}), 404

        last = hist.iloc[-1]
        high, low, close = float(last["High"]), float(last["Low"]), float(last["Close"])
        pivot = (high + low + close) / 3
        r1 = 2 * pivot - low
        s1 = 2 * pivot - high
        r2 = pivot + (high - low)
        s2 = pivot - (high - low)

        return jsonify(
            {
                "symbol": symbol,
                "pivot": round(pivot, 2),
                "r1": round(r1, 2),
                "r2": round(r2, 2),
                "s1": round(s1, 2),
                "s2": round(s2, 2),
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.post("/api/notify")
def notify():
    """Send a reminder email. Body: {"email": "...", "subject": "...", "message": "..."}
    subject/message are optional — sensible defaults are used for the
    portfolio-rebalance reminder button."""
    data = request.get_json(silent=True) or {}
    to_email = (data.get("email") or "").strip()

    if not to_email:
        return jsonify({"error": "missing 'email'"}), 400

    subject = data.get("subject") or "Wealth Sense: แจ้งเตือนตรวจพอร์ตใน 7 วัน"
    message = data.get("message") or (
        "นี่คืออีเมลแจ้งเตือนจาก Wealth Sense\n\n"
        "ระบบจะเตือนให้คุณกลับมาตรวจพอร์ตและพิจารณาแผนปรับสมดุล (rebalance) อีกครั้งใน 7 วัน"
    )

    if not all([SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD]):
        return (
            jsonify(
                {
                    "error": "ยังไม่ได้ตั้งค่า SMTP บนฝั่ง backend — ดู backend/.env.example "
                    "แล้วสร้างไฟล์ backend/.env ใส่ค่าจริงก่อนใช้งาน"
                }
            ),
            500,
        )

    try:
        msg = MIMEText(message, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM_EMAIL
        msg["To"] = to_email

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())

        return jsonify({"status": "sent", "to": to_email})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
