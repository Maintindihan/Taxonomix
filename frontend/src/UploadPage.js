import React, { useState } from "react";
import axios from "axios";

function UploadPage({ onNavigate }) {
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
          "Content-Type": "multipart/form-data"
        }
      });
      setMessage(res.data.message || "Data cleaning successful!");
      console.log(res.data);
      if (res.data.filename) {
        setDownloadFilename(res.data.filename);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("Upload failed.");
    }
  };

  return (
    <div className="bg-seasalt min-h-screen text-raisin font-sans">
      {/* Header Navigation */}
      <header className="bg-[#191923] text-[#F7F9F9] p-4 flex justify-between items-center">
        <h2
          className="text-xl font-bold cursor-pointer hover:text-[#798478] transition"
          onClick={() => onNavigate("home")}
        >
          Taxonomix
        </h2>
        <button
          onClick={() => onNavigate("upload")}
          className="bg-[#798478] text-[#F7F9F9] px-4 py-2 rounded hover:bg-[#6e776e] transition"
        >
          Upload Dataset
        </button>
      </header>

      {/* Upload Area */}
      <main className="flex flex-col items-center justify-center mt-32 px-4">
        <h1 className="text-3xl font-bold mb-6">Upload a CSV File</h1>

        <div className="bg-white border border-[#798478] rounded p-6 shadow-md w-full max-w-md text-center">
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            className="block w-full mb-4 text-[#191923]"
          />
          <button
            onClick={handleUpload}
            className="bg-[#798478] text-[#F7F9F9] px-6 py-2 rounded hover:bg-[#6e776e] transition"
          >
            Upload
          </button>

          {message && (
            <p className="mt-4 text-sm text-[#191923] italic">{message}</p>
          )}
            {downloadFilename && (
            <a
              href={`http://localhost:8000/download/${downloadFilename}`}
              className="mt-4 inline-block bg-[#191923] text-[#F7F9F9] px-6 py-2 rounded hover:bg-[#333340] transition"
              download
            >
              Download Cleaned CSV
            </a>
            )}
        </div>
      </main>
    </div>
  );
}

export default UploadPage;
