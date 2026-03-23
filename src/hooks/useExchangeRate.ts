import { useCallback, useEffect, useState } from "react";

const CACHE_KEY = "exchangeRate:USD_INR";
const TTL = 1000 * 60 * 60 * 6; 

async function fetchRate(): Promise<number> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error("Failed to fetch exchange rates");
  const data = await res.json();
  const rate = data?.rates?.INR;
  if (typeof rate !== "number") throw new Error("INR rate not found in response");
  return rate;
}

export default function useExchangeRate() {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchRate();
      setRate(r);
      const payload = { rate: r, ts: Date.now() };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      } catch {
        
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.rate && parsed?.ts && Date.now() - parsed.ts < TTL) {
          setRate(parsed.rate);
          setLoading(false);
          return;
        }
      }
    } catch {
      
    }

    refresh();
  }, [refresh]);

  return { rate, loading, error, refresh };
}
