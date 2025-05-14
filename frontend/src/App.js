=import React, { useState } from "react";
import UploadPage from "./UploadPage";
import HomePage from "./HomePage";

function App() {
  const [page, setPage] = useState("home");

  return (
    <div>
      <nav>
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => setPage("upload")}>Upload CSV</button>
      </nav>

      {page === "home" && <HomePage />}
      {page === "upload" && <UploadPage />}
    </div>
  );
}

export default App;
