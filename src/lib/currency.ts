export function convertUSDToINR(amountUSD: number, rate: number) {
  return amountUSD * rate;
}

export function formatCurrency(amount: number, currency: "USD" | "INR") {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);
  }

  
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}
