import React from "react";

function HomePage({ onNavigate }) {
  const styles = {
    container: {
      backgroundColor: "rgb(247, 249, 249)",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif",
      color: "rgb(25, 25, 35)",
    },
    header: {
      backgroundColor: "rgb(25, 25, 35)",
      padding: "1rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    navButton: {
      backgroundColor: "rgb(121, 132, 120)",
      color: "rgb(247, 249, 249)",
      border: "none",
      padding: "0.5rem 1rem",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "1rem",
    },
    titleSection: {
      textAlign: "center",
      marginTop: "10vh",
    },
    title: {
      fontSize: "3rem",
      marginBottom: "1rem",
    },
    description: {
      fontSize: "1.25rem",
      maxWidth: "600px",
      margin: "0 auto",
      color: "rgb(121, 132, 120)",
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={{ color: "rgb(247, 249, 249)" }}>Taxonomy Cleaner</h2>
        <button style={styles.navButton} onClick={() => onNavigate("upload")}>
          Upload Page
        </button>
      </header>

      <main style={styles.titleSection}>
        <h1 style={styles.title}>Welcome to the Taxonomy Cleaner</h1>
        <p style={styles.description}>
          This tool helps you upload and clean biological taxonomy data from CSV
          files. Normalize scientific names and detect taxonomy hierarchies
          effortlessly. Kick to the gut! Ka pow, boom. . .boom. . .
        </p>
      </main>
    </div>
  );
}

export default HomePage;
