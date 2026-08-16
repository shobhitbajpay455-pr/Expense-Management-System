# Expense Management System (ExpenseHub)
> **Capstone Project** | Developed by **Shobhit Bajpay**

A modern, full-featured Expense Management System featuring an interactive **Web Application Dashboard**, built-in **Financial Calculators & Budget Planners**, and an enhanced **Command-Line Interface (CLI)**. The application tracks, categorizes, and analyzes daily personal and project expenditures with persistent CSV data storage.

---

## Key Features

### 🌐 Web Dashboard (`app.py`)
- **Interactive KPI Cards**: Real-time summary of Total Expenditure, Transaction Count, Average Spending per entry, and Top Spending Category.
- **Visual Analytics & Charts**:
  - **Category Breakdown**: Interactive Doughnut chart powered by Chart.js.
  - **Monthly Spending Trend**: Bar chart showcasing spending progression.
- **Built-in Financial Calculators & Tools**:
  - 🧮 **Quick Financial Calculator**: Popup math calculator with a 1-click **"Use Amount in Add Expense"** feature.
  - 👥 **Split Bill / Group Calculator**: Calculate per-person shares with custom Tip and GST/tax percentages, and add your share straight to expenses.
  - 📊 **Monthly Budget Planner & Safe Daily Spend Tracker**: Set monthly spending targets, monitor percentage consumed, and get safe daily allowance recommendations.
- **Full CRUD Operations**:
  - Add expenses with date pickers, category selection, amount validation, and payment method options.
  - In-place Edit and Delete with confirmation modals.
- **Live Search & Filtering**: Instant search across descriptions and categories without page reloads.
- **Sorting**: Sort by Date (newest/oldest) or Amount (highest/lowest).
- **Export & Import**:
  - Direct 1-click **Export to CSV**.
  - **Import CSV** feature to merge external expense files.
  - **1-Click Demo Data**: Seed realistic sample records instantly for testing.
- **Responsive & Modern UI**: Built with semantic HTML5, pure CSS variables, and clean typography.

### 💻 Terminal CLI (`expense.py`)
- Formatted tabular terminal output with aligned headers and currency symbols.
- Robust input validation (prevents crashes from invalid amounts or malformed dates).
- Options to Add, View, Calculate Totals/Averages, Search, Delete, and Seed demo records.
- Backward and forward compatible with the shared `expenses.csv` data engine.

---

## 🛠️ Technologies Used
- **Backend**: Python 3, Flask
- **Data Engine**: Python standard `csv`, `os`, `uuid`, `datetime`
- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+)
- **Data Visualization**: Chart.js
- **Version Control**: Git & GitHub

---

## 📂 Project Structure

```text
├── app.py                 # Flask Web Server and REST API
├── expense.py             # Interactive Terminal CLI interface
├── expense_manager.py     # Centralized CSV data engine with validation & CRUD
├── expenses.csv           # Persistent CSV storage file
├── requirements.txt       # Python dependencies
├── run_web.bat            # 1-Click launcher for Web Application (Windows)
├── run_cli.bat            # 1-Click launcher for Terminal CLI (Windows)
├── templates/
│   └── index.html         # Main Web Dashboard template with Calculators & Modals
├── static/
│   ├── css/
│   │   └── style.css      # Custom modern styling and responsive layout
│   └── js/
│       └── app.js         # Frontend controller, Chart.js & Calculator logic
└── README.md              # Project documentation
```

---

## 🚀 How to Run

### 1. Web Application (Recommended)

#### Option A: 1-Click Launch (Windows)
Double-click `run_web.bat`.

#### Option B: Terminal
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the web application
python app.py
```
Open your web browser and navigate to:
```
http://127.0.0.1:5000
```

---

### 2. Terminal CLI

#### Option A: 1-Click Launch (Windows)
Double-click `run_cli.bat`.

#### Option B: Terminal
```bash
python expense.py
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Web Dashboard interface |
| `GET` | `/api/expenses` | List all expenses (supports `search`, `category`, `sort_by`, `order`) |
| `GET` | `/api/expenses/<id>` | Fetch a single expense by ID |
| `POST` | `/api/expenses` | Add a new expense record |
| `PUT` | `/api/expenses/<id>` | Update an existing expense record |
| `DELETE` | `/api/expenses/<id>` | Delete an expense record |
| `GET` | `/api/summary` | Fetch analytics, KPIs, and chart datasets |
| `GET` | `/api/meta` | Get list of categories and payment methods |
| `POST` | `/api/seed` | Populate sample demo transactions |
| `GET` | `/export-csv` | Download `expenses.csv` file |
| `POST` | `/import-csv` | Upload and merge external CSV data |

---

## 👨‍💻 Author
**Shobhit Bajpay**
- Capstone Project: Expense Management System
