import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Header";


export default function ThankYouPage() {
    const navigate = useNavigate();
    const location = useLocation();
    // const amount = location.state?.amount;
    const amountInCents = location.state?.amount || 0;
    const formattedAmount = (amountInCents / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    return (
        <div><Header showDonate={false} />
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <h1 className="text-4xl font-bold mb-4">🎉 Donation Successful!</h1>
            <p className="text-xl mb-6">
                Thank you for your donation of {formattedAmount} to Taxonomix. 
            </p>
        <button
            className="bg-raisin-600 text-raisin px-4 py-2 rounded hover:bg-raisin-700 transition"
            onClick={() => navigate("/")}
        >
            Back to Taxonomix
        </button>
    </div>
    </div>
    );
}