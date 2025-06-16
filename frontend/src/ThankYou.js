import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Header";


export default function ThankYouPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const amount = location.state?.amount;

    return (
        <div><Header showDonate={false} />
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <h1 className="text-4xl font-bold mb-4">🎉 Donation Successful!</h1>
            <p className="text-xl mb-6">
                Thank you so much for the donation of{" "}
                <span className="font-semibold">${(amount / 100).toFixed(2)}</span> to Taxonomix. 
            </p>
        <button
            className="bg-battleship-600 text-seasalt px-4 py-2 rounded hover:bg-battleship-700 transition"
            onClick={() => navigate("/")}
        >
            Back to Taxonomix
        </button>
    </div>
    </div>
    );
}