import React from "react";
import { Routes, Route } from "react-router-dom";
import UploadPage from "./UploadPage";
import HomePage from "./HomePage";
import DonationPage from "./DonationPage";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_YourPublicKeyHere"); // Get it from a dashboard

function App() {

    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Elements stripe={stripePromise}>
          <Route path="/donate" element={<DonationPage />} />
        </Elements>
        <Route 
        path="*" 
        element={
          <div className="text-center mt-10">
            404 - Page Not Found. . .maybe we haven't discovered that animal yet?
            </div>
          } 
        />
      </Routes>
  );
}

export default App;
