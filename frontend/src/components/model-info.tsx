import { Brain, Database, Layers, BarChart2, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { ModelMetrics } from "@/lib/api"

const FEATURE_LIST = [
  { name: "Open", description: "Daily opening price" },
  { name: "High", description: "Daily high price" },
  { name: "Low", description: "Daily low price" },
  { name: "Close", description: "Adjusted closing price" },
  { name: "Volume", description: "Daily trading volume" },
  { name: "Return", description: "Daily percentage return" },
  { name: "MA_5", description: "5-day moving average" },
  { name: "MA_20", description: "20-day moving average" },
  { name: "MA_50", description: "50-day moving average" },
  { name: "Volatility_20", description: "20-day rolling return std dev" },
  { name: "RSI_14", description: "14-period Wilder RSI" },
  { name: "High_Low_Range", description: "(High − Low) / Close" },
  { name: "Open_Close_Range", description: "(Close − Open) / Open" },
  { name: "Volume_Change", description: "Daily volume % change" },
]

const ARCHITECTURE_LAYERS = [
  { layer: "Input", config: "Shape (60, 14) — 60-day lookback × 14 features" },
  { layer: "LSTM", config: "64 units, return_sequences=True" },
  { layer: "Dropout", config: "Rate 0.20" },
  { layer: "LSTM", config: "32 units, return_sequences=False" },
  { layer: "Dropout", config: "Rate 0.20" },
  { layer: "Dense", config: "32 units, ReLU activation" },
  { layer: "Output", config: "3 units, linear (1D / 1W / 1M returns)" },
]

type ModelInfoProps = {
  metrics: ModelMetrics
  symbol: string
}

export const ModelInfo = ({ metrics, symbol }: ModelInfoProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm w-full">
      <CardHeader className="pb-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="model-info-content"
        >
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground shrink-0" />
            <CardTitle className="text-base">Model Information</CardTitle>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent id="model-info-content" className="pt-0 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricTile
              icon={<BarChart2 className="h-4 w-4" />}
              label="Val Loss (MSE)"
              value={metrics.final_loss.toFixed(6)}
            />
            <MetricTile
              icon={<BarChart2 className="h-4 w-4" />}
              label="Val MAE"
              value={metrics.final_mae.toFixed(6)}
            />
            <MetricTile
              icon={<Layers className="h-4 w-4" />}
              label="Epochs Trained"
              value={String(metrics.epochs_trained)}
            />
            <MetricTile
              icon={<Database className="h-4 w-4" />}
              label="Training Samples"
              value={metrics.total_samples.toLocaleString()}
            />
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              Architecture
            </p>
            <div className="rounded-xl border border-border overflow-hidden">
              {ARCHITECTURE_LAYERS.map((row, i) => (
                <div
                  key={row.layer + i}
                  className="flex items-center gap-3 px-3 py-2 text-sm border-b border-border last:border-0 even:bg-muted/30"
                >
                  <Badge variant="outline" className="rounded-lg text-xs shrink-0 w-20 justify-center">
                    {row.layer}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{row.config}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Compiled with Adam optimizer · MSE loss · MAE metric
            </p>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-muted-foreground" />
              Input Features ({metrics.features_used})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {FEATURE_LIST.map((f) => (
                <div key={f.name} className="flex items-start gap-2 text-xs">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground shrink-0">
                    {f.name}
                  </code>
                  <span className="text-muted-foreground pt-0.5">{f.description}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong className="text-foreground">Data source:</strong> Yahoo Finance via{" "}
              <code className="rounded bg-muted px-1">yfinance</code> · Adjusted OHLCV from 2015-01-01
            </p>
            <p>
              <strong className="text-foreground">Lookback window:</strong> {metrics.lookback_days} trading days
              (60-day sliding window)
            </p>
            <p>
              <strong className="text-foreground">Targets:</strong> Forward returns — 1 day, 5 days, 21 days
              ahead · Inverse-scaled to dollar prices using spot close of {symbol}
            </p>
            <p>
              <strong className="text-foreground">Training:</strong> All available data trained on-demand · EarlyStopping
              on val_loss (patience=10, restore_best_weights=True)
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

type MetricTileProps = {
  icon: React.ReactNode
  label: string
  value: string
}

const MetricTile = ({ icon, label, value }: MetricTileProps) => (
  <div className="rounded-xl border border-border bg-muted/30 p-3">
    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <p className="text-sm font-semibold tabular-nums">{value}</p>
  </div>
)
