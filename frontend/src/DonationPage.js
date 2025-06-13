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
    const { name, value } = e.target;
    let newValue = value;

    if (name === "firstName" || name === "lastName") {
      // Remove non-letters and spaces
      newValue = value.replace(/[^a-zA-Z]/g, '');

      if (newValue.length > 0){
        newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1).toLowerCase();
      }
    }

    else if (name === "cardName") {
      // Allow only letters and a single space
      let cleaned = value.replace(/[^a-zA-Z ]/g, '');

      // Only allow one space
      const firstSpaceIndex = cleaned.indexOf(' ');
      if (firstSpaceIndex !== -1) {
        // Truncate after second word (ignore any second+ spaces)
        cleaned = cleaned.slice(0, firstSpaceIndex + 1) + cleaned.slice(firstSpaceIndex + 1).replace(/ /g, '');
      }

      // Capitalize first letters of each word
      const parts = cleaned.split(' ');
      if(parts.length === 1){
        newValue = parts[0].charAt(0).toUpperCase()  + parts[0].slice(1).toLowerCase();
      } else if (parts.length === 2) {
        const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        const second = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
        newValue = `${first} ${second}`;
      } else {
        newValue = cleaned; 
      }
    }
      
    else if (name === "cardNumber") {
      // Strip non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      newValue = digitsOnly.match(/.{1,4}/g)?.join(' ') ?? '';
    }

    else if (name === "securityCode") {
      // Only allow digits and limit to 3 characters
      newValue = value.replace(/\D/g, '').slice(0, 3);
      
    }

    setFormData((prev) => ({
        ...prev,
      [name]: newValue,
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
        maxLength={19} // 16 digits + 3 spaces
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