export function formatChartDate(value: string | number): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

export function formatCurrencyAxis(value: string | number): string {
  return `$${(Number(value) / 1000).toFixed(0)}k`;
}

export function formatSentiment(value: number): string {
  if (value === 0) {
    return "Fear";
  }

  if (value === 50) {
    return "Neutral";
  }

  if (value === 100) {
    return "Greed";
  }

  return String(value);
}
