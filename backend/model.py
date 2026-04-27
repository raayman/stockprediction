"""
LSTM-Based Stock Price Prediction Model
Converts the notebook pipeline into a production-ready Python module.
"""

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from pandas.tseries.offsets import BDay
from typing import Any

np.random.seed(42)


LOOKBACK: int = 60
FEATURE_COLUMNS: list[str] = [
    "Open", "High", "Low", "Close", "Volume",
    "Return", "MA_5", "MA_20", "MA_50",
    "Volatility_20", "RSI_14",
    "High_Low_Range", "Open_Close_Range", "Volume_Change",
]
TARGET_COLUMNS: list[str] = ["Target_1D", "Target_1W", "Target_1M"]
START_DATE: str = "2015-01-01"


def download_data(symbol: str, start_date: str = START_DATE) -> pd.DataFrame:
    """Download and flatten adjusted OHLCV data from Yahoo Finance."""
    raw = yf.download(symbol, start=start_date, auto_adjust=True, progress=False)
    if raw.empty:
        raise ValueError(f"No data returned for symbol '{symbol}'")
    if isinstance(raw.columns, pd.MultiIndex):
        raw.columns = raw.columns.get_level_values(0)
    raw.dropna(inplace=True)
    return raw


def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Wilder-smoothed RSI."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def create_features(raw: pd.DataFrame) -> pd.DataFrame:
    """Engineer all 14 input features from raw OHLCV data."""
    df = raw.copy()
    df["Return"] = df["Close"].pct_change()
    df["MA_5"] = df["Close"].rolling(5).mean()
    df["MA_20"] = df["Close"].rolling(20).mean()
    df["MA_50"] = df["Close"].rolling(50).mean()
    df["Volatility_20"] = df["Return"].rolling(20).std()
    df["RSI_14"] = calculate_rsi(df["Close"], 14)
    df["High_Low_Range"] = (df["High"] - df["Low"]) / df["Close"]
    df["Open_Close_Range"] = (df["Close"] - df["Open"]) / df["Open"]
    df["Volume_Change"] = df["Volume"].pct_change()
    df.dropna(inplace=True)
    return df


def create_targets(df: pd.DataFrame) -> pd.DataFrame:
    """Add forward-return targets for 1D, 1W, and 1M horizons."""
    df = df.copy()
    df["Target_1D"] = df["Close"].shift(-1) / df["Close"] - 1
    df["Target_1W"] = df["Close"].shift(-5) / df["Close"] - 1
    df["Target_1M"] = df["Close"].shift(-21) / df["Close"] - 1
    df.dropna(inplace=True)
    return df


def prepare_sequences(
    X_scaled: np.ndarray,
    y_scaled: np.ndarray,
    lookback: int = LOOKBACK,
) -> tuple[np.ndarray, np.ndarray]:
    """Build overlapping (lookback, n_features) windows for LSTM input."""
    X_seq, y_seq = [], []
    for i in range(lookback, len(X_scaled)):
        X_seq.append(X_scaled[i - lookback : i])
        y_seq.append(y_scaled[i])
    return np.array(X_seq), np.array(y_seq)


def build_lstm_model(input_shape: tuple[int, int]) -> Sequential:
    """
    Stacked LSTM regressor with 3-horizon multi-output.
    Architecture: LSTM(64) -> LSTM(32) -> Dense(32) -> Dense(3)
    """
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=input_shape),
        Dropout(0.20),
        LSTM(32, return_sequences=False),
        Dropout(0.20),
        Dense(32, activation="relu"),
        Dense(3),
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    return model


def run_prediction(symbol: str) -> dict[str, Any]:
    """
    Full pipeline: download -> feature engineering -> scale ->
    sequence creation -> train -> predict.

    Trains on ALL available data (full-model approach) and predicts
    the next 1D / 1W / 1M forward returns from the latest window.
    """
    raw = download_data(symbol)
    df = create_features(raw)
    df = create_targets(df)

    X_data = df[FEATURE_COLUMNS].values
    y_data = df[TARGET_COLUMNS].values

    feature_scaler = MinMaxScaler()
    target_scaler = MinMaxScaler()
    X_scaled = feature_scaler.fit_transform(X_data)
    y_scaled = target_scaler.fit_transform(y_data)

    X_seq, y_seq = prepare_sequences(X_scaled, y_scaled, LOOKBACK)

    model = build_lstm_model(input_shape=(LOOKBACK, len(FEATURE_COLUMNS)))
    early_stop = EarlyStopping(
        monitor="val_loss",
        patience=10,
        restore_best_weights=True,
        verbose=0,
    )
    history = model.fit(
        X_seq, y_seq,
        epochs=100,
        batch_size=32,
        validation_split=0.10,
        callbacks=[early_stop],
        verbose=0,
    )

    latest_window = X_scaled[-LOOKBACK:].reshape(1, LOOKBACK, len(FEATURE_COLUMNS))
    pred_scaled = model.predict(latest_window, verbose=0)
    future_returns: list[float] = target_scaler.inverse_transform(pred_scaled)[0].tolist()

    latest_close_raw = float(np.array(raw["Close"].iloc[-1]).flatten()[-1])
    last_date = raw.index[-1]

    predicted_1d = latest_close_raw * (1 + future_returns[0])
    predicted_1w = latest_close_raw * (1 + future_returns[1])
    predicted_1m = latest_close_raw * (1 + future_returns[2])

    def _change_pct(pred: float) -> float:
        return round((pred - latest_close_raw) / latest_close_raw * 100, 2)

    history_180 = (
        raw["Close"]
        .tail(180)
        .reset_index()
        .rename(columns={"Date": "date", "Close": "close"})
    )
    history_records = [
        {"date": str(row["date"].date()), "close": round(float(row["close"]), 2)}
        for _, row in history_180.iterrows()
    ]

    epochs_trained = len(history.history["loss"])
    final_loss = float(history.history["val_loss"][-1])
    final_mae = float(history.history["val_mae"][-1])

    return {
        "symbol": symbol.upper(),
        "spot_price": round(latest_close_raw, 2),
        "last_date": str(last_date.date()),
        "predictions": {
            "1d": {
                "price": round(predicted_1d, 2),
                "date": str((last_date + BDay(1)).date()),
                "change_pct": _change_pct(predicted_1d),
            },
            "1w": {
                "price": round(predicted_1w, 2),
                "date": str((last_date + BDay(5)).date()),
                "change_pct": _change_pct(predicted_1w),
            },
            "1m": {
                "price": round(predicted_1m, 2),
                "date": str((last_date + BDay(21)).date()),
                "change_pct": _change_pct(predicted_1m),
            },
        },
        "history": history_records,
        "model_metrics": {
            "final_loss": round(final_loss, 6),
            "final_mae": round(final_mae, 6),
            "epochs_trained": epochs_trained,
            "total_samples": len(X_seq),
            "features_used": len(FEATURE_COLUMNS),
            "lookback_days": LOOKBACK,
        },
    }
