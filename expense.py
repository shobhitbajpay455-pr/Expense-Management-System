"""
Expense Management System - Terminal CLI Interface
Capstone Project

This module provides an interactive command-line interface for managing expenses,
powered by the centralized expense_manager engine.
"""

from datetime import datetime
import expense_manager


def print_table(expenses):
    """Prints a nicely formatted ASCII table of expenses."""
    if not expenses:
        print("\n[!] No expenses found.")
        return

    col_widths = {
        "ID": 8,
        "Date": 12,
        "Category": 18,
        "Amount": 12,
        "Method": 12,
        "Description": 30
    }

    # Header
    header = (
        f"{'#':<4} | "
        f"{'Date':<{col_widths['Date']}} | "
        f"{'Category':<{col_widths['Category']}} | "
        f"{'Amount (INR)':>{col_widths['Amount']}} | "
        f"{'Method':<{col_widths['Method']}} | "
        f"{'Description':<{col_widths['Description']}}"
    )
    separator = "-" * len(header)

    print("\n" + separator)
    print(header)
    print(separator)

    total = 0.0
    for idx, exp in enumerate(expenses, 1):
        desc = (exp["description"][:27] + "...") if len(exp["description"]) > 30 else exp["description"]
        cat = (exp["category"][:15] + "...") if len(exp["category"]) > 18 else exp["category"]
        amt = float(exp["amount"])
        total += amt

        print(
            f"{idx:<4} | "
            f"{exp['date']:<{col_widths['Date']}} | "
            f"{cat:<{col_widths['Category']}} | "
            f"{amt:>{col_widths['Amount']}.2f} | "
            f"{exp.get('payment_method', 'Cash'):<{col_widths['Method']}} | "
            f"{desc:<{col_widths['Description']}}"
        )

    print(separator)
    print(f"Total Entries: {len(expenses)} | Total Amount: INR {total:.2f}")
    print(separator + "\n")


def add_expense_cli():
    """Prompts user to add an expense with validation."""
    print("\n--- ADD NEW EXPENSE ---")
    today = datetime.today().strftime("%Y-%m-%d")
    date_input = input(f"Enter Date (YYYY-MM-DD or DD-MM-YYYY) [Default: {today}]: ").strip()
    if not date_input:
        date_input = today

    print("\nAvailable Categories:")
    for i, cat in enumerate(expense_manager.CATEGORIES, 1):
        print(f"  {i}. {cat}")
    
    cat_choice = input("Select Category number or enter custom name [1]: ").strip()
    if not cat_choice:
        category = expense_manager.CATEGORIES[0]
    elif cat_choice.isdigit() and 1 <= int(cat_choice) <= len(expense_manager.CATEGORIES):
        category = expense_manager.CATEGORIES[int(cat_choice) - 1]
    else:
        category = cat_choice

    while True:
        amt_str = input("Enter Amount (e.g. 250.00): ").strip()
        try:
            amount = float(amt_str)
            if amount <= 0:
                print("[!] Amount must be greater than zero. Try again.")
                continue
            break
        except ValueError:
            print("[!] Invalid number. Please enter a valid amount (e.g. 150 or 99.50).")

    description = input("Enter Description / Note: ").strip()
    if not description:
        description = "General expense"

    print("\nPayment Methods: 1. UPI  2. Cash  3. Credit Card  4. Debit Card  5. Net Banking")
    pm_choice = input("Select Payment Method [1]: ").strip()
    pm_map = {"1": "UPI", "2": "Cash", "3": "Credit Card", "4": "Debit Card", "5": "Net Banking"}
    payment_method = pm_map.get(pm_choice, "UPI" if not pm_choice else pm_choice)

    try:
        new_exp = expense_manager.add_expense(date_input, category, amount, description, payment_method)
        print(f"\n[+] Expense of INR {new_exp['amount']:.2f} for '{new_exp['category']}' added successfully!")
    except Exception as e:
        print(f"[!] Error adding expense: {e}")


def view_expenses_cli():
    """Displays all expenses in a formatted table."""
    expenses = expense_manager.get_all_expenses(sort_by="Date", order="desc")
    print_table(expenses)


def total_expense_cli():
    """Displays summary calculations and analytics."""
    stats = expense_manager.get_summary_stats()
    print("\n" + "=" * 45)
    print("           EXPENSE SUMMARY REPORT")
    print("=" * 45)
    print(f" Total Spent        : INR {stats['total_expense']:.2f}")
    print(f" Total Transactions : {stats['transaction_count']}")
    print(f" Average / Expense  : INR {stats['average_expense']:.2f}")
    print(f" Highest Expense    : INR {stats['highest_expense']:.2f}")
    print(f" Top Category       : {stats['top_category']}")
    print("-" * 45)
    print(" Category Breakdown:")
    if stats['category_breakdown']:
        for cat, amt in stats['category_breakdown'].items():
            pct = (amt / stats['total_expense'] * 100) if stats['total_expense'] > 0 else 0
            print(f"   • {cat:<20}: INR {amt:>8.2f} ({pct:>5.1f}%)")
    else:
        print("   (No data)")
    print("=" * 45 + "\n")


def search_category_cli():
    """Searches expenses by category or keyword."""
    print("\n--- SEARCH EXPENSES ---")
    query = input("Enter search term (category, note, or date): ").strip()
    if not query:
        print("[!] Search query cannot be empty.")
        return

    results = expense_manager.get_all_expenses(search=query)
    print(f"\nSearch results for '{query}':")
    print_table(results)


def delete_expense_cli():
    """Allows user to delete an expense."""
    expenses = expense_manager.get_all_expenses(sort_by="Date", order="desc")
    if not expenses:
        print("\n[!] No expenses to delete.")
        return

    print_table(expenses)
    choice = input("Enter the row number (#) to delete (or 0 to cancel): ").strip()
    if not choice.isdigit() or int(choice) == 0:
        print("[*] Deletion cancelled.")
        return

    idx = int(choice)
    if 1 <= idx <= len(expenses):
        target = expenses[idx - 1]
        confirm = input(f"Are you sure you want to delete '{target['description']}' (INR {target['amount']:.2f})? (y/n): ").strip().lower()
        if confirm == "y":
            expense_manager.delete_expense(target["id"])
            print("[+] Expense deleted successfully!")
        else:
            print("[*] Deletion cancelled.")
    else:
        print("[!] Invalid row number.")


def main():
    expense_manager.ensure_csv_file()

    while True:
        print("\n" + "=" * 32)
        print("     EXPENSE TRACKER SYSTEM")
        print("=" * 32)
        print(" 1. Add Expense")
        print(" 2. View All Expenses")
        print(" 3. View Summary & Analytics")
        print(" 4. Search Expenses")
        print(" 5. Delete Expense")
        print(" 6. Seed Sample Demo Data")
        print(" 7. Launch Web Application")
        print(" 8. Exit")
        print("=" * 32)

        choice = input("Enter your choice (1-8): ").strip()

        if choice == "1":
            add_expense_cli()
        elif choice == "2":
            view_expenses_cli()
        elif choice == "3":
            total_expense_cli()
        elif choice == "4":
            search_category_cli()
        elif choice == "5":
            delete_expense_cli()
        elif choice == "6":
            expense_manager.seed_sample_data()
            print("[+] Sample demo expenses loaded successfully!")
        elif choice == "7":
            print("\n[*] To launch the Web Application, run: python app.py")
            print("[*] Or open http://127.0.0.1:5000 in your web browser.")
        elif choice == "8":
            print("\nThank you for using Expense Management System. Goodbye!\n")
            break
        else:
            print("[!] Invalid choice! Please enter a number between 1 and 8.")


if __name__ == "__main__":
    main()