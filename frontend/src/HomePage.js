import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProcessingPage from "./ProcessingPage"; 

function HomePage() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [downloadFilename, setDownloadFilename] = useState("");
  const [processing, setProcessing] = useState(false);
  const [readyForDownload, setReadyForDownload] = useState(false);
  const [totalNames, setTotalNames] = useState(0);

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);


    try {
      // setMessage("Starting processing. . .");
      setProcessing(true); // Bring up the processing page

      const res = await axios.post("http://localhost:8000/api/csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const taskId = res.data.task_id; 
      const total = res.data.total || 0;


      if(!taskId) {
        throw new Error("No file task id returned from backend.")
      }

      setDownloadFilename(file.name);
      setReadyForDownload(false);
      setTotalNames(total);

      // Pass filename as argument to pollProgress
      console.log("Upload response:", res.data);

      pollProgress(taskId);

    } catch (err) {
      console.error("Upload error: ",err);
      setMessage("Upload failed.");
      setProcessing(false);
    }

  };

  // Polling function that will take the filename as a parameter
  const pollProgress = async (taskId) => {
    try {
      const progressRes = await axios.get(`http://localhost:8000/progress/${taskId}`);
      const { progress, status } = progressRes.data;

      console.log("Poll result: ", progressRes.data);

      if (status === "error") {
        setMessage("Error during processing.");
        setProcessing(false);
        return;
      }

      if (status === "done" || progress >= 100) {
        setProcessing(false); // Bring user back to the homepage
        setReadyForDownload(true);
      } else {
        setTimeout(() => pollProgress(taskId), 1000); // Keep polling
      }
    } catch (err) {
      console.error("Error chcecking progress: ", err);
      setMessage("Error checking progress.");
      setProcessing(false); // Fail-safe fallback
    }
  };

  if (processing) {
    return (
      <ProcessingPage 
        totalNames={totalNames}
        onComplete={() => {
          setProcessing(false);
          setReadyForDownload(true);
          setMessage(`${downloadFilename} ready for download`);
        }}
        />
      );
  }

  return (
    <div className="bg-seasalt min-h-screen text-raisin font-sans">
      {/* Header Navigation */}
      <header className="bg-raisin text-seasalt p-4 flex justify-between items-center">
        <h2
          className="text-xl font-bold cursor-pointer hover:text-battleship transition"
          onClick={() => navigate("/")}
        >
          Taxonomix
        </h2>
        <button
          onClick={() => navigate("/donate")}
          className="bg-battleship text-seasalt px-4 py-2 rounded hover:bg-[#6e776e] transition"
        >
          Donation
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
            className="block w-full mb-4 text-raisin center"
          />
        <button
          onClick={handleUpload}
          className="bg-battleship text-seasalt px-6 py-2 rounded hover:bg-[#6e776e] transition center"
          >
            Clean Dataset
          </button>

          {message && (
            <p className="mt-4 text-sm text-raisin italic">{message}
            </p>
          )}

          {readyForDownload && downloadFilename && (
            <p className="mt-4 text-md text-raisin font-semibold">
              {downloadFilename} ready for download
            </p>
          )}

          {downloadFilename && readyForDownload && (
            <a 
              href={`http://localhost:8000/download/${downloadFilename}`}
              className="mt-2 inline-block bg-raisin text-seasalt px-6 py-2 rounded hover:bg-[#333340] transition"
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