# Resume Analysis Tool

A professional, single-page application built with React and Vite that analyzes PDF resumes against a target job role (or auto-detects the best-fit role) to generate an objective visual scorecard in seconds.

---

## 🚀 Key Features

* **AI-Guided Target Role Detection**: Unsure which job to target? Select the **"Not Sure"** option, and the AI will analyze your experience, education, and skills to auto-detect your optimal career path.
* **Deterministic Scoring Consistency**: Formulates evaluations using a strict system prompt and `temperature: 0.0` to ensure that identical resume uploads yield consistent, repeatable results.
* **Self-Healing API Fallback Chain**: Sequential failover mechanism that safeguards against model outages on OpenRouter. If a model throws a transient error (404, 429, 502, 503) or hangs, it automatically rolls over:
  1. `openai/gpt-4o-mini:free`
  2. `qwen/qwen3-30b-a3b:free`
  3. `google/gemma-3-27b-it:free`
  4. `qwen/qwen3-coder:free`
  5. `nvidia/nemotron-3-ultra-550b-a55b:free`
  6. `google/gemma-4-31b-it:free` (Premium backup)
  7. `openai/gpt-oss-120b:free` (Premium backup)
* **60-Second Request Timeout**: Outfitted with an `AbortController` timeout covering the complete connection and body reading phase, protecting the client from infinite streaming loops or upstream provider freezes.
* **Dynamic Location & Currency Detection**: Automatically scans contact info/locations on the resume to display salary statistics and trend charts in local currency (supporting **INR ₹**, **GBP £**, **EUR €**, **USD $**, etc.) and standard local formatting (e.g., Lakhs `L` for Indian Rupee).
* **Skills Gap Learning Roadmap**: Provides a curated step-by-step visual learning path (actions, hands-on projects, and resume updates) for the top recommended skills.
* **Vector-Perfect PDF Export**: Includes an **Export PDF** button utilizing a custom `@media print` style configuration. It preserves Recharts SVG vectors for high-definition printouts, while hiding buttons, scrollbars, and backgrounds.

---

## 🛠️ Tech Stack

* **Core**: React.js + Vite (JavaScript)
* **Visualizations**: Recharts (`RadarChart`, `BarChart`)
* **Icons**: Lucide React
* **PDF Processing**: Client-side parsing using [PDF.js](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js) loaded via CDN (ArrayBuffer extraction up to 6,000 words).
* **Styling**: Vanilla CSS with support for dark/light themes.

---

## ⚙️ Getting Started

### Prerequisites
* Node.js (v18+)
* npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Abhinav087/Talent-Lens.git
   cd Talent-Lens
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration
To save time during local development, copy the template and configure your OpenRouter key:
1. Create a `.env` file in the root folder:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your key:
   ```env
   VITE_OPENROUTER_API_KEY=sk-or-v1-your_actual_key_here
   ```
*Note: Storing the key in `.env` is completely optional. If not set, you can paste the key directly into the password input on the upload screen.*

### Run Locally
Start the Vite local development server:
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### Build for Production
Compile and minify the project bundle:
```bash
npm run build
```
The production bundle will be generated under the `dist/` directory.
