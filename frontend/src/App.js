import React, { useState } from "react";
import UploadPage from "./UploadPage";
import HomePage from "./HomePage";
import DonationPage from "./DonationPage";

function App() {
  const [page, setPage] = useState("home");

    return (
    <>
      {page === "home" && <HomePage onNavigate={setPage} />}
      {page === "upload" && <UploadPage onNavigate={setPage} />}
      {page === "donate" && <DonationPage onNavigate={setPage} />}
    </>
  );
}

export default App;
