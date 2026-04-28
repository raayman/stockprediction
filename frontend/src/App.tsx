import { Github } from "lucide-react"
import { PredictionDashboard } from "@/components/prediction-dashboard"

const App = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <p className="text-sm font-semibold leading-tight">Stock Prediction Model</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">CAP 4630 · AI School Project</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-1.5 hover:bg-accent transition-colors"
            aria-label="GitHub repository"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>

    <main className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
      <div className="mb-10 text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Stock Price Prediction
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base leading-relaxed">
          Stacked LSTM neural network trained on historical OHLCV + technical indicators.
          Predicts forward returns for <strong className="text-foreground">1 day</strong>,{" "}
          <strong className="text-foreground">1 week</strong>, and{" "}
          <strong className="text-foreground">1 month</strong> horizons.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {["TensorFlow / Keras", "LSTM", "yfinance", "FastAPI"].map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-lg border border-border bg-secondary/50 text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <PredictionDashboard />
    </main>

    <footer className="border-t border-border mt-20">
      <div className="container mx-auto max-w-5xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>
          CAP 4630 — Introduction to Artificial Intelligence &nbsp;·&nbsp; Deep Learning School Project
        </p>
        <p className="text-center sm:text-right">
          Model predictions are for educational purposes only. Not financial advice.
        </p>
      </div>
    </footer>
  </div>
)

export default App
