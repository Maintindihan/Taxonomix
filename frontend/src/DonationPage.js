import React, { useState } from 'react';
import Header from "./components/Header";


const presetAmounts = [5, 10, 20];

export default function DonationPage() {
  const [step, setStep] = useState(1); // Step 1 = amount selection, Step 2 = payment form
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');

  const [formData, setFormData] = useState({
      email: '',
      firstName: '',
      lastName: '',
      cardName: '',
      cardNumber: '',
      expMonth: '',
      expYear: '',
      securityCode: ''
  });

  const handlePresetClick = (amount) => {
    const cents = (amount * 100).toString();
    setSelectedAmount(amount);
    setCustomAmount(cents);
  };

  const handleCustomChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ''); // remove all non-digits
    setCustomAmount(raw.slice(0,6));
    setSelectedAmount(null);
  };

  const handleDonate = () => {
    const amount = parseInt(customAmount, 10) / 100;
    if (!amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid donation amount.');
      return;
    }

    // Navigate to the payment page with the amount LATER
    // navigate('/donate/payment', { state: { amount } });
    setStep(2);
  };

  const formattedAmount = customAmount
    ? (parseInt(customAmount, 10) / 100).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
    })
    : '';

  const handleFormChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCompleteDonation = () => {
    console.log("Donation Info:", { ...formData, amount: formattedAmount });
    // This will send info to the backend /donation/payment endpoint

  };

  return (
    <div>
    <Header showDonate={false}/>
    <div className="max-w-md mx-auto mt-10 p-6 bg-raisin text-seasalt rounded-xl shadow-md space-y-4">

      {/* Step 1: Amount Selection */ }
      {step === 1 && (
      <>
      <h2 className="text-xl font-bold text-center">Support Our Work</h2>

      <div className="flex justify-around">
        {presetAmounts.map((amt) => (
          <button
            key={amt}
            onClick={() => handlePresetClick(amt)}
            className={`px-4 py-2 rounded-full border font-semibold transition ${
              selectedAmount === amt
                ? 'bg-battleship-500 text-seasalt border-battleship'
                : 'bg-white text-battleship border-battleship hover:bg-battleship hover:text-seasalt'
            }`}
          >
            ${amt}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="$0.00"
        inputMode="numeric"
        value={formattedAmount}
        onChange={handleCustomChange}
        className="w-full px-4 py-2 border border-battleship rounded-md bg-seasalt placeholder:text-battleship text-raisin font-mono text-lg tracking-wide"
      />

      <button
        onClick={handleDonate}
        className="w-full bg-battleship text-seasalt py-2 px-4 rounded-md hover:bg-[#6e776e] transition font-bold"
      >
        Donate
      </button>
    </>

  )}

  {/* Step 2: Payment Details */}
  {step === 2 && (
    <>
    <h2 className="text-xl font-bold text-center">Enter Payment Details</h2>

      <input
        type="email"
        name="email"
        placeholder="Email Address (optional)"
        className="w-full px-4 py-2 border rounded-md text-black"
        value={formData.email}
        onChange={handleFormChange}
      />
      <input
        type="text"
        name="firstName"
        placeholder="First Name"
        className="w-full px-4 py-2 border rounded-md text-black"
        value={formData.firstName}
        onChange={handleFormChange}
      />
      <input
        type="text"
        name="lastName"
        placeholder="Last Name"
        className="w-full px-4 py-2 border rounded-md text-black"
        value={formData.lastName}
        onChange={handleFormChange}
      />
      <input
        type="text"
        name="cardName"
        placeholder="Name on Card"
        className="w-full px-4 py-2 border rounded-md text-black"
        value={formData.cardName}
        onChange={handleFormChange}
      />
      <input
        type="text"
        name="cardNumber"
        placeholder="Card Number"
        className="w-full px-4 py-2 border rounded-md text-black"
        value={formData.cardNumber}
        onChange={handleFormChange}
      />
      
      <div className="flex gap-2">
        <select
          name="expMonth"
          value={formData.expMonth}
          onChange={handleFormChange}
          className="w-1/2 px-4 py-2 border rounded-md text-black"
        >
          <option value="">Month</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={`${i + 1}`.padStart(2, '0')}>
              {`${i + 1}`.padStart(2, '0')}
            </option>
          ))}
        </select>

        <select
          name="expYear"
          value={formData.expYear}
          onChange={handleFormChange}
          className="w-1/2 px-4 py-2 border rounded-md text-black"
        >
          <option value="">Year</option>
          {[...Array(10)].map((_, i) => {
            const year = new Date().getFullYear() + i;
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
      </div>

      <input
        type="text"
        name="securityCode"
        placeholder="Security Code"
        className="w-full px-4 py-2 border rounded-md text-black"
        value={formData.securityCode}
        onChange={handleFormChange}
      />
      
      <div className="text-center text-lg font-medium mt-4">
        Donation Amount: {formattedAmount}
      </div>

      <button
        onClick={handleCompleteDonation}
        className="w-full mt-4 bg-battleship text-seasalt py-2 px-4 rounded-md hover:bg-raisin"
      >
        Complete Donation
      </button>
          </>
        )}
      </div>
    </div>
  );
}