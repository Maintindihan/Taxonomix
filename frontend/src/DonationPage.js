// DonationPage.jsx
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import Header from "./components/Header";

const stripePromise = loadStripe("pk_test_YOUR_PUBLIC_KEY");

export default function DonationPage({ onNavigate }) {
  const predefinedAmounts = [5, 10, 20];
  const [amount, setAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");

  const handleAmountClick = (amt) => {
    setAmount(amt);
    setCustomAmount("");
  };

  const handleCustomChange = (e) => {
    setCustomAmount(e.target.value);
    setAmount(null);
  };

  const handleDonate = async () => {
    const finalAmount = amount ?? parseFloat(customAmount);
    if (!finalAmount || finalAmount <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }

    const stripe = await stripePromise;
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalAmount }),
    });

    const session = await response.json();
    await stripe.redirectToCheckout({ sessionId: session.id });
  };

  return (
    <div className="bg-seasalt min-h-screen text-raisin font-sans">
      <Header showDonate={false} onNavigate={onNavigate} />
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-battleship">Make a Donation</h2>
        <div className="flex justify-center gap-4 mb-4">
          {predefinedAmounts.map((amt) => (
            <button
              key={amt}
              className={`px-4 py-2 rounded border ${
                amount === amt ? "bg-battleship text-seasalt" : "bg-seasalt text-battleship"
              }`}
              onClick={() => handleAmountClick(amt)}
            >
              ${amt}
            </button>
          ))}
        </div>
        <div className="mb-6">
          <input
            type="number"
            placeholder="Custom amount"
            value={customAmount}
            onChange={handleCustomChange}
            className="px-4 py-2 rounded border text-center"
            min="1"
            step="0.01"
          />
        </div>
        <button
          onClick={handleDonate}
          className="bg-battleship text-seasalt px-6 py-3 rounded hover:bg-[#6e776e] transition"
        >
          Donate
        </button>
      </div>
    </div>
  );
}
