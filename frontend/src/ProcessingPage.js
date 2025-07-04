import React, { useEffect, useState } from "react";

function ProcessingPage({ totalNames, taskId, onComplete }) {
  const API_BASE = "https://api.taxonomix.net";

  const [processedCount, setProcessedCount] = useState(0);
  const [harmonizedCount, setHarmonizedCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/progress/${taskId}`); // Endpoint returns { processed, harmonized, total }
        const data = await res.json();
        const percent = data.progress || 0;
        setProcessedCount(Math.round((percent / 100) * totalNames))

        console.log("task ID: ", taskId)

        setHarmonizedCount(0);

        if (data.processed >= data.total) {
          clearInterval(interval);
          onComplete();
        }
      } catch (err) {
        console.error("Error fetching progress:", err);
        clearInterval(interval);
      }
    }, 1000); // Poll every second

    return () => clearInterval(interval);
  }, [onComplete]);

  const percent = totalNames ? Math.min((processedCount / totalNames) * 100, 100) : 0;

  return (
    <div className="bg-seasalt min-h-screen text-raisin font-sans flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4">Cleaning Dataset</h1>
      <p className="text-lg mb-6">Processing taxonomic names, please wait...</p>

      {/* <div className="w-full max-w-xl bg-gray-300 rounded-full h-6 overflow-hidden mb-4">
        <div
          className="bg-[#798478] h-full transition-all"
          style={{ width: `${percent}%` }}
        ></div>
      </div> */}

      {/* <p className="text-sm text-gray-700 mb-2">
        Processed {processedCount} of {totalNames} names ({percent.toFixed(1)}%)
      </p>

      <p className="text-sm text-gray-600 italic">
        ✅ Scientific names harmonized: {harmonizedCount}
      </p> */}
    </div>
  );
}

export default ProcessingPage;
