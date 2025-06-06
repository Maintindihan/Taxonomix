import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UploadPage from "./UploadPage";
import HomePage from "./HomePage";
import DonationPage from "./DonationPage";

function App() {

    return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/donate" element={<DonationPage />} />
        <Route path="*" element={<div className="text-center mt-10">404 - Page Not Found. . .maybe we haven't discovered that animal yet?</div>} />
      </Routes>
    </Router>
  );
}

export default App;
