import React from "react";
import { Routes, Route } from "react-router-dom";
import UploadPage from "./UploadPage";
import HomePage from "./HomePage";
import DonationPage from "./DonationPage";

function App() {

    return (
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/donate" element={<DonationPage />} />
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
