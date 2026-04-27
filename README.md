# LSTM-Based Stock Price Prediction System

## Overview

This project develops an advanced deep learning system for multi-horizon stock price prediction using Long Short-Term Memory (LSTM) neural networks. The model is trained end-to-end on historical OHLCV data augmented with technical indicators, and predicts forward returns for three distinct time horizons: **1 trading day**, **1 trading week (5 days)**, and **1 trading month (21 days)**.

The system is deployed as a full-stack web application: a **FastAPI** Python backend hosts the LSTM inference pipeline, and a **Vite + React** frontend provides an interactive prediction dashboard with real-time charting.

---

## Project Objectives

The primary goal of this project is to create an intelligent time-series regression system that can:

- Download and preprocess real-time stock market data automatically via Yahoo Finance
- Engineer meaningful technical features from raw OHLCV (Open, High, Low, Close, Volume) data
- Train a stacked LSTM model on a sliding 60-day lookback window
- Predict 1-day, 1-week, and 1-month forward closing prices with confidence
- Visualize historical price trends alongside future price targets in an interactive chart
- Present an accessible, professional web UI for non-technical users

---

## Dataset

The project retrieves data dynamically at prediction time using the `yfinance` library:

| Property | Details |
|----------|---------|
| **Source** | Yahoo Finance (`yfinance`) |
| **Start Date** | January 1, 2015 |
| **End Date** | Latest available trading day |
| **Interval** | Daily (1d) |
| **Adjustment** | Auto-adjusted for splits and dividends |
| **Supported Tickers** | Any valid Yahoo Finance equity symbol (AAPL, MSFT, TSLA, etc.) |

For a typical large-cap stock like AAPL, this yields approximately **2,800–3,000** daily trading rows (≈11 years), providing a robust training set for the LSTM model.

---

## Feature Engineering

The model uses **14 input features** derived from the raw OHLCV data:

| Feature | Formula / Source | Category |
|---------|-----------------|----------|
| `Open` | Raw opening price | Price |
| `High` | Raw intraday high | Price |
| `Low` | Raw intraday low | Price |
| `Close` | Adjusted closing price | Price |
| `Volume` | Daily trading volume | Volume |
| `Return` | `Close.pct_change()` | Momentum |
| `MA_5` | 5-day rolling mean of Close | Trend |
| `MA_20` | 20-day rolling mean of Close | Trend |
| `MA_50` | 50-day rolling mean of Close | Trend |
| `Volatility_20` | 20-day rolling std dev of Return | Volatility |
| `RSI_14` | Wilder 14-period Relative Strength Index | Momentum |
| `High_Low_Range` | `(High − Low) / Close` | Volatility |
| `Open_Close_Range` | `(Close − Open) / Open` | Momentum |
| `Volume_Change` | `Volume.pct_change()` | Volume |

All features are normalized to [0, 1] using a `MinMaxScaler` before being fed to the LSTM.

---

## Target Variables

The model predicts **forward returns** (fractional change from the current closing price):

| Target | Formula | Horizon |
|--------|---------|---------|
| `Target_1D` | `Close.shift(-1) / Close − 1` | Next trading day |
| `Target_1W` | `Close.shift(-5) / Close − 1` | Next 5 trading days |
| `Target_1M` | `Close.shift(-21) / Close − 1` | Next 21 trading days |

At inference time, these returns are inverse-scaled and multiplied by the latest spot price to produce **dollar price targets**.

---

## Model Architecture

The project employs a **Stacked LSTM** regression architecture with multi-output:

```
Input Shape: (60, 14)  — 60 trading days × 14 features
───────────────────────────────────────────────────
Layer 1:  LSTM       │ 64 units │ return_sequences=True
Layer 2:  Dropout    │ rate=0.20
Layer 3:  LSTM       │ 32 units │ return_sequences=False
Layer 4:  Dropout    │ rate=0.20
Layer 5:  Dense      │ 32 units │ activation=ReLU
Layer 6:  Dense      │  3 units │ linear (output)
───────────────────────────────────────────────────
Output: [return_1d, return_1w, return_1m]
```

**Compile Configuration**

| Parameter | Value |
|-----------|-------|
| Optimizer | Adam (default lr=0.001) |
| Loss | Mean Squared Error (MSE) |
| Metric | Mean Absolute Error (MAE) |
| Epochs | Up to 100 (EarlyStopping patience=10) |
| Batch Size | 32 |
| Validation Split | 10% of training data |
| Callbacks | EarlyStopping (restore_best_weights=True) |

**Sequence Generation**

A sliding window of `lookback=60` trading days generates overlapping (60, 14) tensors. Each tensor maps to the 3-dimensional target vector at the last position, ensuring the model learns temporal dependencies across 3 months of trading history.

---

## Performance Metrics

The model is evaluated on a held-out 20% test split (chronological, no shuffle) using dollar-space MAE and RMSE:

### Example Results — Ticker: MU (Micron Technology)

| Horizon | MAE | RMSE |
|---------|-----|------|
| 1 Day | $5.63 | $9.87 |
| 1 Week | $11.57 | $19.01 |
| 1 Month | $23.93 | $36.09 |

*Metrics are computed in dollar space after inverse-transforming the normalized return predictions.*

### Training Convergence

| Metric | Value |
|--------|-------|
| Optimal Epochs | ~12 (converged well before maximum 100) |
| Training Accuracy | Stable validation loss, no divergence |
| Generalization | Train/Val gap remains consistent (EarlyStopping) |

> **Note:** Error magnitudes scale with price. A $5.63 MAE on a $100 stock represents ~5.6% error; on a $50 stock, it would be ~11.2%. Relative percentage error is a better absolute comparison across tickers.

---

## Project Structure

```
predictionml/
├── README.md                          # Project documentation (this file)
│
├── backend/                           # Python FastAPI backend
│   ├── requirements.txt               # Python dependencies
│   ├── model.py                       # LSTM pipeline module
│   └── routes.py                      # FastAPI application + API endpoints
│
├── frontend/                          # Vite + React frontend
│   ├── package.json                   # Node dependencies
│   ├── vite.config.ts                 # Vite configuration
│   ├── index.html                     # HTML entry point
│   ├── tsconfig.json                  # TypeScript config
│   ├── components.json                # shadcn/ui config
│   └── src/
│       ├── main.tsx                   # React entry point
│       ├── App.tsx                    # Root layout component
│       ├── index.css                  # Tailwind 4 + CSS theme tokens
│       ├── lib/
│       │   ├── utils.ts               # Tailwind class merge utility
│       │   └── api.ts                 # API fetch wrapper + TypeScript types
│       └── components/
│           ├── ui/                    # shadcn/ui primitives
│           ├── stock-search.tsx       # Symbol input + quick-select
│           ├── prediction-dashboard.tsx  # Main orchestrator component
│           ├── prediction-cards.tsx   # 1D / 1W / 1M price target cards
│           ├── price-chart.tsx        # Recharts area chart with forecast overlay
│           ├── model-info.tsx         # Collapsible model architecture panel
│           └── loading-state.tsx      # Skeleton placeholder during inference
│
└── notebooks/
    └── stock_price_prediction_deep_learning.ipynb  # Exploratory analysis notebook
```

---

## Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 20 or higher
- pip package manager
- 4 GB RAM minimum (8 GB recommended for training)
- GPU optional (training runs on CPU, ~30–90 seconds per prediction)

### Docker (Recommended)

The easiest way to run the full stack is with Docker Compose:

```bash
cd predictionml
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |

To stop: `docker compose down`

### Manual Setup (without Docker)

**Backend**

```bash
cd predictionml/backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python routes.py
```

**Frontend**

```bash
cd predictionml/frontend
npm install
npm run dev
```

---

## Usage

### Web Application

1. Start both the backend and frontend servers as described above.
2. Open `http://localhost:5173` in your browser.
3. Type a stock ticker symbol (e.g., `AAPL`, `MSFT`, `TSLA`) into the search bar.
4. Click **Predict** or press Enter.
5. Wait 30–90 seconds while the LSTM trains on historical data.
6. View price targets, the price chart with forecast overlays, and model metrics.

### API Endpoint

```bash
# Direct API call
curl "http://localhost:8000/predict?symbol=AAPL"
```

**Response shape:**

```json
{
  "symbol": "AAPL",
  "spot_price": 189.84,
  "last_date": "2026-04-24",
  "predictions": {
    "1d": { "price": 191.20, "date": "2026-04-27", "change_pct": 0.72 },
    "1w": { "price": 194.50, "date": "2026-05-01", "change_pct": 2.45 },
    "1m": { "price": 198.30, "date": "2026-05-29", "change_pct": 4.45 }
  },
  "history": [{ "date": "2025-10-24", "close": 170.50 }],
  "model_metrics": {
    "final_loss": 0.001234,
    "final_mae": 0.025678,
    "epochs_trained": 12,
    "total_samples": 2654,
    "features_used": 14,
    "lookback_days": 60
  }
}
```

### Jupyter Notebook

```bash
# Run the exploratory analysis notebook
cd predictionml
jupyter notebook notebooks/stock_price_prediction_deep_learning.ipynb
```

The notebook includes step-by-step data exploration, feature engineering, model training, evaluation plots, and forward forecasting.

---

## Key Features

- **Multi-Horizon Prediction** — simultaneous 1D, 1W, 1M targets from a single model pass
- **Real-Time Data** — live OHLCV data fetched via Yahoo Finance at inference time
- **Technical Feature Engineering** — 9 engineered features on top of raw OHLCV
- **Early Stopping** — automatic training halt when validation loss plateaus
- **Interactive Chart** — 6-month price history area chart with forecast marker overlay
- **Responsive UI** — mobile-first design with Tailwind CSS and shadcn/ui components
- **REST API** — clean FastAPI backend with OpenAPI documentation
- **Dark Mode** — default dark theme using OKLCH color tokens

---

## Technologies Used

| Layer | Technology |
|-------|-----------|
| Deep Learning | TensorFlow 2.16 / Keras |
| Model Architecture | Stacked LSTM (custom Sequential) |
| Data Source | yfinance (Yahoo Finance) |
| Data Processing | NumPy, Pandas |
| Feature Scaling | scikit-learn MinMaxScaler |
| API Framework | FastAPI + Uvicorn |
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui + Radix UI |
| Charting | Recharts |
| Research | Jupyter Notebook |

---

## Project Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Research & Planning | Week 1 | Dataset analysis, feature selection, model design |
| Phase 2: Model Development | Week 2–3 | LSTM implementation, training loop, evaluation metrics |
| Phase 3: Backend API | Week 3 | FastAPI routes, CORS, error handling |
| Phase 4: Frontend UI | Week 4 | React app, chart visualization, responsive design |
| Phase 5: Integration & Docs | Week 5 | End-to-end testing, README, presentation |

---

## Limitations & Caveats

- **On-demand training** — the model trains fresh per request (~30–90 seconds). In production, models would be pre-trained and cached with periodic retraining.
- **No external features** — the model uses only price/volume history. Incorporating sentiment, earnings reports, or macroeconomic indicators would likely improve accuracy.
- **Scaler leakage** — the MinMaxScaler is fit on all data before the train/test split, allowing global min/max statistics to inform preprocessing for both sets. This is a known limitation of the notebook approach.
- **Not financial advice** — predictions are a machine learning regression exercise and do not account for fundamental analysis, news events, or market conditions.

---

## Future Improvements

- Pre-train and cache models on a schedule (e.g., nightly retraining via cron)
- Add Transformer / Attention-based architecture as comparison baseline
- Incorporate sentiment analysis from financial news APIs
- Extend to multi-stock portfolio view
- Add prediction confidence intervals via Monte Carlo Dropout
- Deploy to cloud platform (AWS SageMaker, Google Cloud Run, Azure ML)
- Add unit tests for the model pipeline and API endpoints

---

## License

This project is licensed under the MIT License.

---

## Citation

```bibtex
@project{stockprediction2026,
  title     = {LSTM-Based Stock Price Prediction System},
  author    = {Student Name},
  year      = {2026},
  course    = {CAP 4630 - Introduction to Artificial Intelligence},
  note      = {Multi-horizon price prediction using stacked LSTM neural networks}
}
```

---

## Acknowledgments

- **Data**: Yahoo Finance via the `yfinance` open-source library
- **Framework**: TensorFlow and Keras by Google
- **UI**: shadcn/ui component library and Recharts
- **Course**: CAP 4630 — Introduction to Artificial Intelligence

---

## References

- [yfinance Documentation](https://python-yfinance.readthedocs.io/)
- [TensorFlow LSTM Guide](https://www.tensorflow.org/api_docs/python/tf/keras/layers/LSTM)
- [Keras Sequential Model](https://keras.io/guides/sequential_model/)
- [scikit-learn MinMaxScaler](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.MinMaxScaler.html)
- [Hochreiter & Schmidhuber, 1997 — Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf)

---

**Project Status:** Complete

**Last Updated:** April 2026

**Version:** 1.0.0
