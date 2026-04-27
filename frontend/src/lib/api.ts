const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

export type PredictionHorizon = {
  price: number
  date: string
  change_pct: number
}

export type ModelMetrics = {
  final_loss: number
  final_mae: number
  epochs_trained: number
  total_samples: number
  features_used: number
  lookback_days: number
}

export type HistoryPoint = {
  date: string
  close: number
}

export type PredictionResult = {
  symbol: string
  spot_price: number
  last_date: string
  predictions: {
    "1d": PredictionHorizon
    "1w": PredictionHorizon
    "1m": PredictionHorizon
  }
  history: HistoryPoint[]
  model_metrics: ModelMetrics
}

export const fetchPrediction = async (symbol: string): Promise<PredictionResult> => {
  const url = `${API_BASE_URL}/predict?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}`
  const response = await fetch(url)
  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new Error(errorData.detail ?? `Request failed with status ${response.status}`)
  }
  return response.json() as Promise<PredictionResult>
}
