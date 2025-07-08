# 🧬 Taxonomix

**Taxonomix** is a free, open-source tool for cleaning scientific datasets — especially taxonomic names — using a friendly web interface backed by powerful APIs.  
Designed for ecologists, conservation biologists, and researchers working with biodiversity data.

🌐 **Visit the app**  
📬 **Contact**: noa@taxonomix.net

---

## ✨ Features

- 🧠 Smart taxonomic correction using GBIF and other authoritative databases  
- 📊 CSV uploads with automatic field detection  
- 🐛 Detects and corrects misspellings in species names  
- 🔄 Background processing with Redis  
- 📥 Download cleaned files instantly  
- 💳 Secure donation support via Stripe  
- 📦 Darwin Core and XML support *(coming soon!)*  
- 🧹 **Private**: uploaded files are deleted after processing  

---

## 📁 File Formats Supported

- `.csv` *(currently supported)*  
- `.xml`, `.xls`, and **Darwin Core Archive** *(planned)*

---

## 🏗️ Tech Stack

- **Frontend**: React + Stripe.js  
- **Backend**: FastAPI  
- **Worker Queue**: Redis  
- **Deployment**: Render  
- **Taxonomic Matching**: GBIF API  
- **Email Service**: Gmail SMTP (via `.env` config)
