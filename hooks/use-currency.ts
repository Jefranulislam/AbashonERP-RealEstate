import { useEffect, useState } from "react";
import axios from "axios";

interface CurrencySettings {
  currency_code: string;
  currency_symbol: string;
}

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencySettings>({
    currency_code: "BDT",
    currency_symbol: "৳",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const response = await axios.get("/api/settings");
        if (response.data.settings) {
          setCurrency({
            currency_code: response.data.settings.currency_code || "BDT",
            currency_symbol: response.data.settings.currency_symbol || "৳",
          });
        }
      } catch (error) {
        console.error("Error fetching currency settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, []);

  const formatAmount = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${currency.currency_symbol}${num.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return { ...currency, loading, formatAmount };
}
