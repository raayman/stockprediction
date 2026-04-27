import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Line,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { HistoryPoint, PredictionHorizon } from "@/lib/api"

type ForecastPoint = {
  date: string
  close?: number
  forecast1d?: number
  forecast1w?: number
  forecast1m?: number
}

type PriceChartProps = {
  history: HistoryPoint[]
  spotPrice: number
  lastDate: string
  predictions: {
    "1d": PredictionHorizon
    "1w": PredictionHorizon
    "1m": PredictionHorizon
  }
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const formatDateFull = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const formatPrice = (value: number): string =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type CustomTooltipProps = {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-medium mb-1 text-muted-foreground">{label ? formatDateFull(label) : ""}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-foreground">{formatPrice(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export const PriceChart = ({ history, spotPrice, lastDate, predictions }: PriceChartProps) => {
  const historyData: ForecastPoint[] = history.map((h) => ({
    date: h.date,
    close: h.close,
  }))

  const forecastData: ForecastPoint[] = [
    { date: lastDate, close: spotPrice },
    { date: predictions["1d"].date, forecast1d: predictions["1d"].price },
    { date: predictions["1w"].date, forecast1w: predictions["1w"].price },
    { date: predictions["1m"].date, forecast1m: predictions["1m"].price },
  ]

  const combined: ForecastPoint[] = [...historyData, ...forecastData.slice(1)]

  const allPrices = [
    ...history.map((h) => h.close),
    predictions["1d"].price,
    predictions["1w"].price,
    predictions["1m"].price,
  ]
  const minPrice = Math.min(...allPrices) * 0.97
  const maxPrice = Math.max(...allPrices) * 1.03

  const tickCount = Math.min(history.length, 6)
  const tickStep = Math.floor(history.length / tickCount)
  const xTicks = history
    .filter((_, i) => i % tickStep === 0 || i === history.length - 1)
    .map((h) => h.date)

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Price History &amp; Forecast</CardTitle>
        <CardDescription className="text-xs">
          6-month historical close prices with LSTM-predicted targets
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combined} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="oklch(0.488 0.243 264.376)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 8%)" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={xTicks}
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "oklch(0.708 0 0)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                tick={{ fontSize: 11, fill: "oklch(0.708 0 0)" }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={lastDate}
                stroke="oklch(0.708 0 0)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: "Today", position: "top", fontSize: 10, fill: "oklch(0.708 0 0)" }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="oklch(0.488 0.243 264.376)"
                strokeWidth={2}
                fill="url(#historyGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "oklch(0.488 0.243 264.376)" }}
                name="Close"
              />
              <Line
                type="monotone"
                dataKey="forecast1d"
                stroke="oklch(0.696 0.17 162.48)"
                strokeWidth={0}
                dot={{ r: 6, fill: "oklch(0.696 0.17 162.48)", stroke: "oklch(0.145 0 0)", strokeWidth: 2 }}
                name="1D Target"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast1w"
                stroke="oklch(0.769 0.188 70.08)"
                strokeWidth={0}
                dot={{ r: 6, fill: "oklch(0.769 0.188 70.08)", stroke: "oklch(0.145 0 0)", strokeWidth: 2 }}
                name="1W Target"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast1m"
                stroke="oklch(0.645 0.246 16.439)"
                strokeWidth={0}
                dot={{ r: 6, fill: "oklch(0.645 0.246 16.439)", stroke: "oklch(0.145 0 0)", strokeWidth: 2 }}
                name="1M Target"
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1">
          <LegendItem color="oklch(0.488 0.243 264.376)" label="Historical Close" shape="line" />
          <LegendItem color="oklch(0.696 0.17 162.48)" label={`1D → $${predictions["1d"].price.toFixed(2)}`} shape="dot" />
          <LegendItem color="oklch(0.769 0.188 70.08)" label={`1W → $${predictions["1w"].price.toFixed(2)}`} shape="dot" />
          <LegendItem color="oklch(0.645 0.246 16.439)" label={`1M → $${predictions["1m"].price.toFixed(2)}`} shape="dot" />
        </div>
      </CardContent>
    </Card>
  )
}

type LegendItemProps = {
  color: string
  label: string
  shape: "line" | "dot"
}

const LegendItem = ({ color, label, shape }: LegendItemProps) => (
  <div className="flex items-center gap-1.5">
    {shape === "line" ? (
      <div className="h-0.5 w-5 rounded-full" style={{ backgroundColor: color }} />
    ) : (
      <div className="h-2.5 w-2.5 rounded-full border border-background" style={{ backgroundColor: color }} />
    )}
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
)
