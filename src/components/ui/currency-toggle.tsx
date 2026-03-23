import React from "react";

type Currency = "USD" | "INR";

interface Props {
  value: Currency;
  onChange: (c: Currency) => void;
}

const CurrencyToggle: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="inline-flex items-center rounded-full bg-muted p-1 text-sm" role="group" aria-label="Currency">
      <button
        type="button"
        className={`px-4 py-2 md:px-3 md:py-1 rounded-full ${value === "USD" ? "bg-primary text-white" : "text-muted-foreground"}`}
        onClick={() => onChange("USD")}
      >
        USD
      </button>
      <button
        type="button"
        className={`px-4 py-2 md:px-3 md:py-1 rounded-full ml-1 ${value === "INR" ? "bg-primary text-white" : "text-muted-foreground"}`}
        onClick={() => onChange("INR")}
      >
        INR
      </button>
    </div>
  );
};

export default CurrencyToggle;
