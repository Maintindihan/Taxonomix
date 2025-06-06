import React, { useState } from 'react';
import Header from "./components/Header";


const presetAmounts = [5, 10, 20];

export default function DonationPage() {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');


  const handlePresetClick = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (e) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(null);
  };

  const handleDonate = () => {
    const amount = selectedAmount ?? parseFloat(customAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      alert('Please enter a valid donation amount.');
      return;
    }

    // Navigate to the payment page with the amount LATER
    // navigate('/donate/payment', { state: { amount } });
  };

  return (
    <div>
    <Header showDonate={false}/>
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-center">Support Our Work</h2>

      <div className="flex justify-around">
        {presetAmounts.map((amt) => (
          <button
            key={amt}
            onClick={() => handlePresetClick(amt)}
            className={`px-4 py-2 rounded-full border ${
              selectedAmount === amt
                ? 'bg-blue-500 text-white'
                : 'bg-white text-blue-500 border-blue-500'
            }`}
          >
            ${amt}
          </button>
        ))}
      </div>

      <input
        type="number"
        min="1"
        placeholder="Or enter a custom amount"
        value={customAmount}
        onChange={handleCustomChange}
        className="w-full px-4 py-2 border rounded-md"
      />

      <button
        onClick={handleDonate}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
      >
        Donate
      </button>
    </div>
  </div>
  );
}
