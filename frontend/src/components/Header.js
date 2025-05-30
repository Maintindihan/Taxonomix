// Header.js
import React from "react";

export default function Header({ showDonate = true, onNavigate }) {
  return (
    <header className="bg-raisin text-seasalt p-4 flex justify-between items-center">
      <h2
        className="text-xl font-bold cursor-pointer hover:text-battleship transition"
        onClick={() => onNavigate("home")}
      >
        Taxonomix
      </h2>
      {showDonate && (
        <button
          onClick={() => onNavigate("donate")}
          className="bg-battleship text-seasalt px-4 py-2 rounded hover:bg-[#6e776e] transition"
        >
          Donation
        </button>
      )}
    </header>
  );
}
