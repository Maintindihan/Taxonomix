// Header.js
import React from "react";
import { useNavigate } from "react-router-dom";


export default function Header({ showDonate = true }) {
  const navigate = useNavigate();
  return (
    <header className="bg-raisin text-seasalt p-4 flex justify-between items-center">
      <h2
        className="text-xl font-bold cursor-pointer hover:text-battleship transition"
        onClick={() => navigate("/")}
      >
        Taxonomix
      </h2>
      {showDonate && (
        <button
          onClick={() => navigate("donate")}
          className="bg-battleship text-seasalt px-4 py-2 rounded hover:bg-[#6e776e] transition"
        >
          Donation
        </button>
      )}
    </header>
  );
}
