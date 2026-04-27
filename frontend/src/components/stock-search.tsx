import { useState, type KeyboardEvent } from "react"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type StockSearchProps = {
  onSearch: (symbol: string) => void
  isLoading: boolean
}

const POPULAR_SYMBOLS = ["AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "GOOGL"]

export const StockSearch = ({ onSearch, isLoading }: StockSearchProps) => {
  const [inputValue, setInputValue] = useState("")

  const handleSubmit = () => {
    const trimmed = inputValue.trim().toUpperCase()
    if (!trimmed || isLoading) return
    onSearch(trimmed)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit()
  }

  const handleQuickSelect = (symbol: string) => {
    setInputValue(symbol)
    onSearch(symbol)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl mx-auto">
      <div className="flex w-full gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 rounded-xl h-11 text-base"
            placeholder="Enter ticker symbol (e.g. AAPL)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-label="Stock ticker symbol"
            maxLength={10}
          />
        </div>
        <Button
          className="rounded-xl h-11 px-6 font-medium"
          onClick={handleSubmit}
          disabled={isLoading || !inputValue.trim()}
          aria-label="Run prediction"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Predicting…
            </>
          ) : (
            "Predict"
          )}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-center">
        <span className="text-xs text-muted-foreground">Popular:</span>
        {POPULAR_SYMBOLS.map((sym) => (
          <button
            key={sym}
            type="button"
            onClick={() => handleQuickSelect(sym)}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Predict ${sym}`}
          >
            {sym}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground animate-pulse text-center">
          Training LSTM model on historical data — this takes 30–90 seconds…
        </p>
      )}
    </div>
  )
}
