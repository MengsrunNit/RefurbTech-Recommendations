# RefurbTech Recommendations

RefurbTech Recommendations is an intelligent, AI-powered platform designed to help users navigate the refurbished smartphone market. It combines a sophisticated recommendation engine, real-time price tracking models, and an interactive AI chatbot to provide accurate, data-driven buying advice.

## 🎯 Purpose

The refurbished phone market is fragmented and pricing can be opaque. This project aims to:
1.  **Demystify Value:** accurately estimate the current market value of used phones using depreciation models.
2.  **Personalize Search:** Match users with the perfect device based on their specific needs (budget, ecosystem, usage) rather than just specs.
3.  **Visualize Trends:** Show how phone prices drop over time to help users decide *when* to buy.

## 🏗️ Infrastructure & Architecture

The project is built as a modern full-stack application with a decoupled frontend and backend, supported by a data ingestion pipeline.

### 1. Frontend (`/web`)
A responsive, single-page application (SPA) featuring a modern "Glassmorphism" UI.
*   **Framework:** Vue.js 3 (Composition API)
*   **Build Tool:** Vite
*   **Visualization:** Chart.js (for interactive price history and forecasting curves)
*   **Routing:** Vue Router
*   **State/Network:** Axios for API communication

### 2. Backend (`/server`)
A RESTful API that handles business logic, AI processing, and pricing calculations.
*   **Runtime:** Node.js & Express.js
*   **Database:** MongoDB (Stores phone specifications, metadata, and scraped data)
*   **AI Engine:** OpenAI API (GPT-4o-mini) integrated with a RAG (Retrieval-Augmented Generation) system to query the local database.
*   **Pricing Engine:** Custom mathematical models (Exponential Decay & Linear Regression) that calculate real-time estimated values based on:
    *   Release Date
    *   Launch Price (MSRP)
    *   Storage Capacity
    *   Condition (Excellent, Good, etc.)

### 3. Data Pipeline (`/data`)
Python scripts responsible for gathering and cleaning market data.
*   **Scraping:** Python (BeautifulSoup/Selenium) scripts to scrape phone specifications and pricing data.
*   **Processing:** Jupyter Notebooks for data analysis and model training (determining depreciation coefficients).

## 🛠️ Technology Stack

| Category | Technology | Usage |
|----------|------------|-------|
| **Frontend** | Vue.js 3 | Core UI Framework |
| | Vite | Build tool & Dev server |
| | Chart.js | Price tracking visualizations |
| | CSS3 | Custom Glassmorphism design system |
| **Backend** | Node.js | Server runtime |
| | Express.js | API Framework |
| | MongoDB | NoSQL Database for phone data |
| | OpenAI API | Chatbot intelligence & function calling |
| **Data** | Python | Web scraping & Data analysis |
| | Pandas/NumPy | Data processing (in notebooks) |

## 🚀 Key Features

### 🤖 AI Chatbot
*   **Context-Aware:** Remembers conversation history.
*   **RAG Integration:** Fetches real-time phone specs from the database to answer questions like "Find me a phone under $300 with a good camera."
*   **Smart Pricing:** Uses the internal pricing engine to quote accurate *refurbished* market prices, not outdated MSRPs.

### 📈 Price Tracker
*   **Depreciation Modeling:** Visualizes the estimated value of phones (iPhone, Pixel, Samsung) over time.
*   **Forecasting:** Predicts future value drops to help users time their purchases.
*   **Interactive Filters:** Adjust by storage size, condition, and model family.

### 🔍 Recommendation Engine
*   **Survey System:** Scores phones based on user inputs (Longevity, Ecosystem, Usage, Budget).
*   **Diversity Logic:** Ensures search results aren't dominated by a single brand, offering a balanced mix of top picks and alternatives.

## 📦 Installation & Setup

1.  **Prerequisites:**
    *   Node.js (v16+)
    *   MongoDB (Local or Atlas URI)
    *   Python 3.x (for data scripts)

2.  **Environment Variables:**
    Create a `.env` file in `server/`:
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/refurbtech
    OPENAI_API_KEY=your_openai_key
    ```

3.  **Install Dependencies:**
    ```bash
    # Backend
    cd server
    npm install

    # Frontend
    cd ../web
    npm install
    ```

4.  **Run Development Server:**
    Use the helper script to run both frontend and backend concurrently:
    ```bash
    ./dev.sh
    ```
    *   Frontend: `http://localhost:5173`
    *   Backend: `http://localhost:3000`

## 📂 Project Structure

```
├── data/               # Python scrapers and Jupyter notebooks
├── server/             # Node.js Express API
│   ├── controllers/    # Business logic (Chat, Recommendations)
│   ├── models/         # Pricing algorithms & Data models
│   ├── routes/         # API Endpoints
│   └── utils/          # Database connection & helpers
├── web/                # Vue.js Frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Main application views
│   │   └── assets/     # Static assets
└── dev.sh              # Startup script
```
