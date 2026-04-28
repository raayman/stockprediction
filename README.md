# Stock Price Prediction (LSTM)

CAP 4630 -- Introduction to Artificial Intelligence

A full-stack app that trains an LSTM neural network on historical stock data and predicts where the price is heading over the next day, week, and month. The backend is Python/FastAPI, the frontend is React + Vite.

## How it works

1. User enters a ticker symbol (like AAPL or TSLA)
2. Backend pulls ~10 years of daily price data from Yahoo Finance using `yfinance`
3. We engineer 14 features from the raw OHLCV data (moving averages, RSI, volatility, etc.)
4. A stacked LSTM model trains on 60-day sliding windows of that data
5. Model outputs predicted returns for 1 day, 1 week, and 1 month ahead
6. Frontend displays the predictions alongside a 6-month price chart

The model trains fresh on each request, so predictions take about 30-90 seconds depending on how much data the ticker has.

## Features used

The model takes in 14 features per timestep:

- **Price**: Open, High, Low, Close
- **Volume**: Raw volume + daily volume % change
- **Trend**: 5-day, 20-day, 50-day moving averages
- **Momentum**: Daily return, RSI (14-period), open-close range
- **Volatility**: 20-day rolling std dev, high-low range

Everything gets normalized to [0, 1] with MinMaxScaler before going into the network.

## Model architecture

```
Input:   (60, 14)  -- 60 trading days, 14 features per day
LSTM:    64 units, return_sequences=True
Dropout: 0.20
LSTM:    32 units
Dropout: 0.20
Dense:   32 units, ReLU
Output:  3 units, linear  -- predicts 1D, 1W, 1M forward returns
```

Trained with Adam optimizer, MSE loss, up to 100 epochs with early stopping (patience=10). In practice it usually converges around epoch 12.

## Project structure

```
predictionml/
├── backend/
│   ├── model.py           # LSTM training + prediction pipeline
│   ├── routes.py          # FastAPI server
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/    # dashboard, chart, search, cards, etc.
│   │   └── lib/           # API client, utils
│   ├── index.html
│   └── package.json
├── notebooks/
│   └── stock_price_prediction_deep_learning.ipynb
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 20+
- 4 GB RAM minimum (8 GB recommended -- training is CPU-bound)
- Docker (optional, but makes setup easier)

## Running it

### Docker (easiest)

```bash
docker compose up --build
```

Frontend runs on `http://localhost:3000`, backend API on `http://localhost:8080`.

For live-reloading during development:

```bash
docker compose watch
```

### Manual setup

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python routes.py
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## API

```bash
curl "http://localhost:8000/predict?symbol=AAPL"
```

Returns JSON with the current price, predictions for each horizon, 6 months of price history, and training metrics.

## Example results (MU)

| Horizon | MAE | RMSE |
|---------|-----|------|
| 1 Day | $5.63 | $9.87 |
| 1 Week | $11.57 | $19.01 |
| 1 Month | $23.93 | $36.09 |

Error scales with stock price -- $5.63 on a $100 stock is ~5.6%, on a $50 stock it's ~11%.

## Tech stack

- **ML**: TensorFlow/Keras, NumPy, Pandas, scikit-learn
- **Backend**: FastAPI, Uvicorn, yfinance
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Recharts
- **Research**: Jupyter Notebook

## Known limitations

- Model trains from scratch every request -- not ideal, but keeps things simple for a school project. A production system would cache trained models.
- Only uses price/volume data. No sentiment, no earnings, no macro indicators.
- MinMaxScaler is fit on all data before train/test split, so there's some information leakage. Good enough for a demo, wouldn't fly in a real trading system.
- **Not financial advice.** This is a class project.

## References

- [yfinance docs](https://python-yfinance.readthedocs.io/)
- [TensorFlow LSTM](https://www.tensorflow.org/api_docs/python/tf/keras/layers/LSTM)
- [Hochreiter & Schmidhuber, 1997 -- Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf)

## License

MIT
