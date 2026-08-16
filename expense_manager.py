import csv
import os
import uuid
from datetime import datetime

FILE_NAME = "expenses.csv"
FIELDNAMES = ["ID", "Date", "Category", "Amount", "Description", "PaymentMethod"]

# Default supported categories
CATEGORIES = [
    "Food & Dining",
    "Transportation",
    "Utilities & Bills",
    "Entertainment",
    "Healthcare",
    "Shopping",
    "Education",
    "Groceries",
    "Personal Care",
    "Other"
]

PAYMENT_METHODS = ["UPI", "Cash", "Credit Card", "Debit Card", "Net Banking", "Other"]


def ensure_csv_file():
    """Ensures expenses.csv exists with the correct header structure."""
    if not os.path.exists(FILE_NAME) or os.path.getsize(FILE_NAME) == 0:
        with open(FILE_NAME, "w", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
            writer.writeheader()
        return

    # Check if header needs migration (if old CSV had fewer columns)
    try:
        with open(FILE_NAME, "r", newline="", encoding="utf-8") as file:
            reader = csv.reader(file)
            first_row = next(reader, None)
            if not first_row:
                with open(FILE_NAME, "w", newline="", encoding="utf-8") as f:
                    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
                    writer.writeheader()
                return

            # If headers don't match the new schema, migrate cleanly
            if first_row != FIELDNAMES:
                _migrate_legacy_csv(first_row)
    except Exception:
        # Fallback recreate
        with open(FILE_NAME, "w", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
            writer.writeheader()


def _migrate_legacy_csv(old_headers):
    """Migrates older CSV format (e.g. Date, Category, Amount, Description) to standard schema."""
    migrated_rows = []
    try:
        with open(FILE_NAME, "r", newline="", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for idx, row in enumerate(reader, start=1):
                expense_id = row.get("ID") or f"exp_{int(datetime.now().timestamp())}_{idx}"
                date_val = _normalize_date(row.get("Date", ""))
                cat_val = row.get("Category", "Other").strip() or "Other"
                try:
                    amt_val = f"{float(row.get('Amount', 0)):.2f}"
                except (ValueError, TypeError):
                    continue  # skip corrupt entry
                desc_val = row.get("Description", "").strip()
                pm_val = row.get("PaymentMethod", "Cash").strip() or "Cash"

                migrated_rows.append({
                    "ID": expense_id,
                    "Date": date_val,
                    "Category": cat_val,
                    "Amount": amt_val,
                    "Description": desc_val,
                    "PaymentMethod": pm_val
                })
    except Exception:
        migrated_rows = []

    with open(FILE_NAME, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(migrated_rows)


def _normalize_date(date_str):
    """Normalizes various date formats to YYYY-MM-DD."""
    if not date_str:
        return datetime.today().strftime("%Y-%m-%d")
    date_str = str(date_str).strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%m-%d-%Y", "%m/%d/%Y"):
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return datetime.today().strftime("%Y-%m-%d")


def get_all_expenses(search=None, category=None, sort_by="Date", order="desc"):
    """
    Retrieves all expenses with optional filtering and sorting.
    """
    ensure_csv_file()
    expenses = []

    with open(FILE_NAME, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if not row or not row.get("ID"):
                continue
            try:
                amt = float(row.get("Amount", 0))
            except (ValueError, TypeError):
                amt = 0.0

            expense = {
                "id": row.get("ID", ""),
                "date": row.get("Date", ""),
                "category": row.get("Category", "Other"),
                "amount": amt,
                "description": row.get("Description", ""),
                "payment_method": row.get("PaymentMethod", "Cash")
            }
            expenses.append(expense)

    # Filter by category
    if category and category.lower() != "all":
        expenses = [e for e in expenses if e["category"].lower() == category.lower()]

    # Filter by search keyword
    if search:
        search_lower = search.lower().strip()
        expenses = [
            e for e in expenses
            if search_lower in e["description"].lower()
            or search_lower in e["category"].lower()
            or search_lower in e["payment_method"].lower()
            or search_lower in e["date"].lower()
        ]

    # Sorting
    reverse = (order.lower() == "desc")
    if sort_by == "Amount":
        expenses.sort(key=lambda x: x["amount"], reverse=reverse)
    elif sort_by == "Category":
        expenses.sort(key=lambda x: x["category"].lower(), reverse=reverse)
    else:  # Default sort by Date
        expenses.sort(key=lambda x: x["date"], reverse=reverse)

    return expenses


def get_expense_by_id(expense_id):
    """Retrieves a single expense by ID."""
    expenses = get_all_expenses()
    for exp in expenses:
        if exp["id"] == str(expense_id):
            return exp
    return None


def add_expense(date, category, amount, description, payment_method="Cash"):
    """
    Adds a new expense after validating inputs.
    Returns the created expense dict or raises ValueError.
    """
    ensure_csv_file()
    
    # Validate amount
    try:
        amt_float = float(amount)
        if amt_float <= 0:
            raise ValueError("Amount must be greater than zero.")
    except (ValueError, TypeError):
        raise ValueError("Invalid amount. Please provide a positive number.")

    # Validate date
    clean_date = _normalize_date(date)
    clean_category = str(category).strip() or "Other"
    clean_description = str(description).strip() or "No description"
    clean_payment = str(payment_method).strip() or "Cash"
    new_id = f"exp_{int(datetime.now().timestamp() * 1000)}_{uuid.uuid4().hex[:6]}"

    new_row = {
        "ID": new_id,
        "Date": clean_date,
        "Category": clean_category,
        "Amount": f"{amt_float:.2f}",
        "Description": clean_description,
        "PaymentMethod": clean_payment
    }

    with open(FILE_NAME, "a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writerow(new_row)

    return {
        "id": new_id,
        "date": clean_date,
        "category": clean_category,
        "amount": amt_float,
        "description": clean_description,
        "payment_method": clean_payment
    }


def update_expense(expense_id, date, category, amount, description, payment_method="Cash"):
    """Updates an existing expense by ID."""
    ensure_csv_file()
    try:
        amt_float = float(amount)
        if amt_float <= 0:
            raise ValueError("Amount must be greater than zero.")
    except (ValueError, TypeError):
        raise ValueError("Invalid amount. Please provide a positive number.")

    clean_date = _normalize_date(date)
    clean_category = str(category).strip() or "Other"
    clean_description = str(description).strip() or "No description"
    clean_payment = str(payment_method).strip() or "Cash"

    all_rows = []
    found = False

    with open(FILE_NAME, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row.get("ID") == str(expense_id):
                row["Date"] = clean_date
                row["Category"] = clean_category
                row["Amount"] = f"{amt_float:.2f}"
                row["Description"] = clean_description
                row["PaymentMethod"] = clean_payment
                found = True
            all_rows.append(row)

    if not found:
        raise ValueError(f"Expense with ID {expense_id} not found.")

    with open(FILE_NAME, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(all_rows)

    return {
        "id": expense_id,
        "date": clean_date,
        "category": clean_category,
        "amount": amt_float,
        "description": clean_description,
        "payment_method": clean_payment
    }


def delete_expense(expense_id):
    """Deletes an expense by ID."""
    ensure_csv_file()
    all_rows = []
    found = False

    with open(FILE_NAME, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row.get("ID") == str(expense_id):
                found = True
                continue
            all_rows.append(row)

    if not found:
        raise ValueError(f"Expense with ID {expense_id} not found.")

    with open(FILE_NAME, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(all_rows)

    return True


def get_summary_stats():
    """
    Computes key summary statistics:
    - total_expense
    - transaction_count
    - average_expense
    - highest_expense
    - top_category
    - category_breakdown
    - monthly_breakdown
    - recent_transactions (last 5)
    """
    expenses = get_all_expenses(sort_by="Date", order="desc")
    
    total_amount = sum(e["amount"] for e in expenses)
    count = len(expenses)
    avg_amount = (total_amount / count) if count > 0 else 0.0
    highest = max((e["amount"] for e in expenses), default=0.0)

    # Category breakdown
    cat_totals = {}
    for e in expenses:
        cat = e["category"]
        cat_totals[cat] = cat_totals.get(cat, 0.0) + e["amount"]

    sorted_cats = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)
    top_cat = sorted_cats[0][0] if sorted_cats else "None"

    # Monthly breakdown (YYYY-MM)
    monthly_totals = {}
    for e in expenses:
        if len(e["date"]) >= 7:
            month_key = e["date"][:7]  # YYYY-MM
            monthly_totals[month_key] = monthly_totals.get(month_key, 0.0) + e["amount"]

    # Sort months chronologically
    sorted_months = sorted(monthly_totals.items(), key=lambda x: x[0])

    # Format category breakdown for charts
    categories_chart = {
        "labels": [item[0] for item in sorted_cats],
        "values": [round(item[1], 2) for item in sorted_cats]
    }

    monthly_chart = {
        "labels": [item[0] for item in sorted_months],
        "values": [round(item[1], 2) for item in sorted_months]
    }

    return {
        "total_expense": round(total_amount, 2),
        "transaction_count": count,
        "average_expense": round(avg_amount, 2),
        "highest_expense": round(highest, 2),
        "top_category": top_cat,
        "category_breakdown": {k: round(v, 2) for k, v in cat_totals.items()},
        "chart_categories": categories_chart,
        "chart_monthly": monthly_chart,
        "recent_expenses": expenses[:5]
    }


def seed_sample_data():
    """Seeds sample expenses if user wants initial demo data."""
    sample_records = [
        ("2026-08-01", "Groceries", 1450.00, "Weekly grocery shopping from supermarket", "UPI"),
        ("2026-08-03", "Food & Dining", 420.50, "Lunch with college team", "UPI"),
        ("2026-08-05", "Transportation", 250.00, "Metro recharge card", "Debit Card"),
        ("2026-08-07", "Utilities & Bills", 1200.00, "Monthly internet fiber broadband", "Net Banking"),
        ("2026-08-10", "Entertainment", 599.00, "Movie tickets and popcorn", "Credit Card"),
        ("2026-08-12", "Shopping", 2150.00, "New running shoes & accessories", "Credit Card"),
        ("2026-08-14", "Healthcare", 380.00, "Prescription medicines and vitamins", "Cash"),
        ("2026-08-15", "Education", 999.00, "Python Web Development Bootcamp course", "UPI"),
        ("2026-08-16", "Food & Dining", 180.00, "Evening coffee and snacks", "UPI"),
    ]

    for date_val, cat, amt, desc, pm in sample_records:
        add_expense(date_val, cat, amt, desc, pm)
