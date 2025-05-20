import React, { useState } from "react";
import axios from "axios";

function HomePage({ onNavigate }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [downloadFilename, setDownloadFilename] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/api/csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage(res.data.message || "Data cleaning successful!");
      if (res.data.filename) {
        setDownloadFilename(res.data.filename);
      }
    } catch (err) {
      console.error("Upload error:" ,err);
      setMessage("Upload failed.");
    }

  };

  return (
    <div className="bg-seasalt min-h-screen text-raisin font-sans">
      {/* Header Navigation */}
      <header className="bg-raisin text-seasalt p-4 flex justify-between items-center">
        <h2
          className="text-xl font-bold cursor-pointer hover:text-battleship transition"
          onClick={() => onNavigate("home")}
        >
          Taxonomix
        </h2>
        <button
          onClick={() => onNavigate("upload")}
          className="bg-battleship text-seasalt px-4 py-2 rounded hover:bg-[#6e776e] transition"
        >
          Money pls
        </button>
      </header>

      {/* Main Content: Split View*/}
      <main className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-80px)] px-8">
        {/* Left Side: Title + Description */}
        <div className="w-full lg:w-1/2 text-right pr-8 mb-10 lg:mb-0">
          <h1 className="text-4xl font-bold mb-4">TAXONOMIX</h1>
          <p className="text-lg leading-relaxed text-raisin">
            Upload any dataset and let taxonomix clean, construct, and organize your taxonomic data.
          </p>
        </div>

        {/* Right Side: Upload Form */}
        <div className="w-full lg:w-1/2 bg-white border border-battleship rounded p-6 shadow-md max-we-md text-center">
          <h2 className="text-2xl font-semibold mb-4">Upload a Dataset</h2>
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            className="block w-full mb-4 text-raisin"
          />
        <button
          onClick={handleUpload}
          className="bg-battleship text-seasalt px-6 py-2 rounded hover:bg-[#6e776e] transition"
          >
            Upload
          </button>

          {message && (
            <p className="mt-4 text-sm text-raisin italic">{message}
            </p>
          )}

          {downloadFilename && (
            <a
              href={`http://localhost:8000/download/${downloadFilename}`}
              className="mt-4 inline-block bg-raisin text-seasalt px-6 py-2 rounded hover:bg-[#333340] transition"
              download
          >
            Download Dataset
          </a>
          )}
      
        </div>
      </main>
    </div>
  );
}

export default HomePage;