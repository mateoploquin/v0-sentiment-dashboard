// Historical Data Generator
// Creates realistic historical sentiment data for visualization

export class HistoryGenerator {
  /**
   * Generates historical sentiment data points
   * Creates a realistic trend based on current score
   */
  static generate(currentScore: number, hours = 24): Array<{ timestamp: string; score: number }> {
    const history = []
    const now = Date.now()

    for (let i = hours - 1; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString()

      // Add variance that decreases as we get closer to current time
      const timeWeight = i / hours // 1.0 at oldest, 0 at newest
      const maxVariance = 30 * timeWeight
      const variance = (Math.random() - 0.5) * maxVariance

      // Gradually trend toward current score
      const trendWeight = 1 - timeWeight
      const historicalBase = currentScore * trendWeight
      const randomBase = (Math.random() - 0.5) * 100 * (1 - trendWeight)

      const score = Math.max(-100, Math.min(100, historicalBase + randomBase + variance))

      history.push({ timestamp, score })
    }

    return history
  }

  /**
   * Generates a smooth trend line
   */
  static generateSmooth(currentScore: number, hours = 24): Array<{ timestamp: string; score: number }> {
    const history = []
    const now = Date.now()

    // Create a smooth sine wave trend
    for (let i = hours - 1; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000).toISOString()

      const progress = 1 - i / hours
      const wave = Math.sin(progress * Math.PI * 2) * 20
      const trend = currentScore * progress
      const score = Math.max(-100, Math.min(100, trend + wave))

      history.push({ timestamp, score })
    }

    return history
  }
}
