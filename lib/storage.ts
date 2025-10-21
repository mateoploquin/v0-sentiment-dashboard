export interface SearchHistoryItem {
  company: string
  timestamp: string
  score: number
}

export class LocalStorage {
  private static HISTORY_KEY = "sentiment-search-history"
  private static MAX_HISTORY = 10

  static getSearchHistory(): SearchHistoryItem[] {
    if (typeof window === "undefined") return []
    try {
      const history = localStorage.getItem(this.HISTORY_KEY)
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  }

  static addToHistory(item: SearchHistoryItem): void {
    if (typeof window === "undefined") return
    try {
      const history = this.getSearchHistory()
      const filtered = history.filter((h) => h.company.toLowerCase() !== item.company.toLowerCase())
      const newHistory = [item, ...filtered].slice(0, this.MAX_HISTORY)
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(newHistory))
    } catch (error) {
      console.error("Failed to save search history:", error)
    }
  }

  static clearHistory(): void {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(this.HISTORY_KEY)
    } catch (error) {
      console.error("Failed to clear search history:", error)
    }
  }
}
