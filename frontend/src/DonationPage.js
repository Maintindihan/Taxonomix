import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";    
import Header from "./components/Header";

const presetAmounts = [5, 10, 20];

export default function DonationPage() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // Step 1 = amount selection, Step 2 = payment form
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [email, setEmail] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePresetClick = (amount) => {
    setCustomAmount((amount * 100).toString());
    setSelectedAmount(amount);
  };

  function cleanNameInput(value) {
    let cleaned = value.replace(/[^a-zA-Z ]/g, '');

    const firstSpaceIndex = cleaned.indexOf(' ');
    if (firstSpaceIndex !== -1) {
      cleaned =
        cleaned.slice(0, firstSpaceIndex + 1) +
        cleaned.slice(firstSpaceIndex + 1).replace(/ /g, '');
    }

    const parts = cleaned.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    } else if (parts.length === 2) {
      const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      const second = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
      return `${first} ${second}`;
    } else {
      return cleaned;
    }
  }

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function isValidFullName(name) {
    return /^[A-Za-z]+ [A-Za-z]+$/.test(name.trim());
  }

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

  const handlePayment = async () => {
    const amount = parseInt(customAmount, 10);

    if (!stripe || !elements) return;

    if (email && !isValidEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (cardName && !isValidFullName(cardName)) {
      alert("Please enter a valid full name (first and last).");
      return;
    }


    setIsProcessing(true);

    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/create-payment-intent`, {
      method: "POST",
      headers:  { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseInt(customAmount, 10),
        cardName: FormData.cardName,
        email,
    }),
  });

  const { clientSecret } = await res.json();

  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: elements.getElement(CardElement),
      billing_details: { 
        email, 
        name: cardName },
    },
  });

  setIsProcessing(false);

  if (result.error) {
    alert(result.error.message);
  } else {
    if (result.paymentIntent.status === "succeeded"){
      navigate("/thank-you", { state: { amount: amount } });
      // Build a redirect to a successful donation page or a reset form here
    }
  }
};

  const formattedAmount = customAmount
    ? (parseInt(customAmount, 10) / 100).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      })
    : "";


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
        placeholder="Email Address(optional)"
        className="w-full px-4 py-2 border rounded-md text-black"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="text"
        placeholder="Full Name(optional)"
        className="w-full px-4 py-2 border rounded-md text-black"
        value={cardName}
        onChange={(e) => setCardName(cleanNameInput(e.target.value))}
      />
      <div className="w-full px-4 py-2 border rounded-md bg-white text-black">
        <CardElement />
      </div>
      <div className="text-center text-lg font-medium mt-4" >
        DonationAmount: {formattedAmount}
      </div>
      <button
        disabled={!stripe || isProcessing}
        onClick={handlePayment}
        className="w-full mt-4 bg-battleship text-seasalt py-2 px-4 rounded-md hover:bg-raisin"
      >
        {isProcessing ? "Processing. . ." : "Complete Donation"}
      </button>
      </>
    )}
    </div>
  </div>
  );
}