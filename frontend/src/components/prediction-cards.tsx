import { TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PredictionHorizon } from "@/lib/api"

type PredictionCardProps = {
  label: string
  horizon: string
  spotPrice: number
  prediction: PredictionHorizon
}

const PredictionCard = ({ label, horizon, spotPrice, prediction }: PredictionCardProps) => {
  const isBullish = prediction.change_pct >= 0
  const dollarChange = prediction.price - spotPrice
  const absChangePct = Math.abs(prediction.change_pct)
  const absDollarChange = Math.abs(dollarChange)

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm flex-1 min-w-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Badge
            variant="outline"
            className="text-xs rounded-lg border-border"
          >
            {horizon}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl md:text-3xl font-semibold tracking-tight">
          ${prediction.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {isBullish ? (
            <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
          )}
          <span
            className={isBullish ? "text-sm font-medium text-emerald-500" : "text-sm font-medium text-red-500"}
          >
            {isBullish ? "+" : "-"}${absDollarChange.toFixed(2)} ({isBullish ? "+" : "-"}{absChangePct.toFixed(2)}%)
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          <span>Target: {prediction.date}</span>
        </div>
      </CardContent>
    </Card>
  )
}

type PredictionCardsProps = {
  spotPrice: number
  symbol: string
  predictions: {
    "1d": PredictionHorizon
    "1w": PredictionHorizon
    "1m": PredictionHorizon
  }
}

export const PredictionCards = ({ spotPrice, symbol, predictions }: PredictionCardsProps) => {
  const overallBullish = predictions["1m"].change_pct >= 0

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{symbol}</h2>
            <Badge
              className={`rounded-xl text-sm font-medium ${
                overallBullish
                  ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                  : "bg-red-500/15 text-red-500 border-red-500/30"
              }`}
              variant="outline"
            >
              {overallBullish ? "Bullish" : "Bearish"} Outlook
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Current price:{" "}
            <span className="text-foreground font-medium">
              ${spotPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PredictionCard
          label="1-Day Forecast"
          horizon="1D"
          spotPrice={spotPrice}
          prediction={predictions["1d"]}
        />
        <PredictionCard
          label="1-Week Forecast"
          horizon="1W"
          spotPrice={spotPrice}
          prediction={predictions["1w"]}
        />
        <PredictionCard
          label="1-Month Forecast"
          horizon="1M"
          spotPrice={spotPrice}
          prediction={predictions["1m"]}
        />
      </div>
    </div>
  )
}
