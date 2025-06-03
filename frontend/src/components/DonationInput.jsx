// src/components/DonationInput.jsx
import React from "react";

// Currency formatter
const formatUSD = (value) => {
  const number = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (isNaN(number)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(number);
};

export default function DonationInput({ customAmount, setCustomAmount }) {
  const handleCustomChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9.]/g, "");
    setCustomAmount(formatUSD(cleaned));
  };

  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="$0.00"
        value={customAmount}
        onChange={handleCustomChange}
        className="px-4 py-2 rounded border text-center w-40"
        inputMode="decimal"
        pattern="^\$?\d+(\.\d{0,2})?$"
      />
    </div>
  );
}
