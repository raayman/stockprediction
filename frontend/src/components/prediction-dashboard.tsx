import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { fetchPrediction, type PredictionResult } from "@/lib/api"
import { StockSearch } from "@/components/stock-search"
import { PredictionCards } from "@/components/prediction-cards"
import { PriceChart } from "@/components/price-chart"
import { ModelInfo } from "@/components/model-info"
import { LoadingState } from "@/components/loading-state"

export const PredictionDashboard = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSearch = async (symbol: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    setResult(null)
    try {
      const data = await fetchPrediction(symbol)
      setResult(data)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      <StockSearch onSearch={handleSearch} isLoading={isLoading} />

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 flex items-start gap-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {isLoading && <LoadingState />}

      {result && !isLoading && (
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <PredictionCards
            symbol={result.symbol}
            spotPrice={result.spot_price}
            predictions={result.predictions}
          />
          <PriceChart
            history={result.history}
            spotPrice={result.spot_price}
            lastDate={result.last_date}
            predictions={result.predictions}
          />
          <ModelInfo metrics={result.model_metrics} symbol={result.symbol} />
        </div>
      )}

      {!result && !isLoading && !errorMessage && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="rounded-2xl border border-border bg-card p-8 max-w-sm w-full space-y-3">
            <p className="font-medium">Enter a ticker symbol above</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The LSTM model will train on historical data and predict price targets for the next day,
              week, and month.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
