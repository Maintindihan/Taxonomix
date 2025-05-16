import React from "react";

function HomePage({ onNavigate }) {
  return (
    <div className="bg-seasalt min-h-screen text-[#191923] font-sans">
      <header className="bg-raisin text-[#F7F9F9] p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Taxonomix</h2>
        <button
          onClick={() => onNavigate("upload")}
          className="bg-battleship text-seasalt px-4 py-2 rounded hover:bg-[#6e776e] transition"
        >
          Upload Dataset
        </button>
      </header>

      <main className="text-center mt-32 px-4">
        <h1 className="text-4xl font-bold mb-4">Welcome to Taxonomix</h1>

        <div className="max-w-xl mx-auto">
        <p className="text-lg max-w-xl text-left text-battleship">
          Upload any biological dataset and taxonomix will help clean, correct
          and standardize your data. Normalize scientific names and detect taxonomy hierarchies
          effortlessly.
        </p>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
