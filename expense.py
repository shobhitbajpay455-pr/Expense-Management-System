import csv
import os

FILE_NAME = "expenses.csv"


def create_file():
    if not os.path.exists(FILE_NAME):
        with open(FILE_NAME, "w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["Date", "Category", "Amount", "Description"])


def add_expense():
    date = input("Enter Date (DD-MM-YYYY): ")
    category = input("Enter Category: ")
    amount = input("Enter Amount: ")
    description = input("Enter Description: ")

    with open(FILE_NAME, "a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([date, category, amount, description])

    print("Expense added successfully!")


def view_expenses():
    with open(FILE_NAME, "r") as file:
        reader = csv.reader(file)

        for row in reader:
            print(row)


def total_expense():
    total = 0

    with open(FILE_NAME, "r") as file:
        reader = csv.DictReader(file)

        for row in reader:
            total += float(row["Amount"])

    print("Total Expense:", total)


def search_category():
    category = input("Enter Category to search: ")

    with open(FILE_NAME, "r") as file:
        reader = csv.DictReader(file)

        found = False

        for row in reader:
            if row["Category"].lower() == category.lower():
                print(row)
                found = True

        if not found:
            print("No expense found.")


def main():
    create_file()

    while True:
        print("\n===== EXPENSE TRACKER =====")
        print("1. Add Expense")
        print("2. View Expenses")
        print("3. Total Expense")
        print("4. Search Category")
        print("5. Exit")

        choice = input("Enter your choice: ")

        if choice == "1":
            add_expense()

        elif choice == "2":
            view_expenses()

        elif choice == "3":
            total_expense()

        elif choice == "4":
            search_category()

        elif choice == "5":
            print("Thank you!")
            break

        else:
            print("Invalid choice!")


main()