"""
Flask application entry point for the Stock Price Prediction API.
Run with: python routes.py
"""

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask.json.provider import DefaultJSONProvider

from model import run_prediction


class NumpyJSONProvider(DefaultJSONProvider):
    """JSON provider that serializes numpy scalars and arrays to native Python types."""

    def default(self, obj: object) -> object:
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


app = Flask(__name__)
app.json_provider_class = NumpyJSONProvider
app.json = NumpyJSONProvider(app)
CORS(app)


@app.get("/")
def root():
    return jsonify({"message": "Stock Price Prediction API running", "version": "1.0.0"})


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/predict")
def predict():
    """
    Train the LSTM model on historical data for the given symbol and
    return 1-day, 1-week, and 1-month price predictions.

    Training runs on-demand (~30–90 seconds depending on hardware).
    """
    symbol = request.args.get("symbol", "").strip().upper()
    if not symbol or not symbol.isalpha() or len(symbol) > 10:
        return jsonify({"detail": "Invalid or missing ticker symbol."}), 400
    try:
        result = run_prediction(symbol)
        return jsonify(result)
    except ValueError as exc:
        return jsonify({"detail": str(exc)}), 404
    except Exception as exc:
        return jsonify({"detail": f"Prediction failed: {str(exc)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
