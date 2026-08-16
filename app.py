"""
Expense Management System - Web Application Server
Capstone Project
Framework: Flask
"""

import io
import os
import csv
from flask import Flask, render_template, request, jsonify, send_file
import expense_manager

app = Flask(__name__)
app.config["SECRET_KEY"] = "expense-tracker-capstone-secret-key-2026"


@app.before_request
def startup_check():
    """Ensure the CSV database file is initialized."""
    expense_manager.ensure_csv_file()


@app.route("/")
def index():
    """Renders the main dashboard."""
    return render_template("index.html")


@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    """
    Returns list of expenses with optional filtering & sorting.
    Query Params:
      - search: string
      - category: string
      - sort_by: 'Date' | 'Amount' | 'Category'
      - order: 'desc' | 'asc'
    """
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    sort_by = request.args.get("sort_by", "Date")
    order = request.args.get("order", "desc")

    expenses = expense_manager.get_all_expenses(
        search=search if search else None,
        category=category if category else None,
        sort_by=sort_by,
        order=order
    )
    return jsonify({
        "status": "success",
        "count": len(expenses),
        "data": expenses
    })


@app.route("/api/expenses/<expense_id>", methods=["GET"])
def get_single_expense(expense_id):
    """Fetches a single expense by ID."""
    expense = expense_manager.get_expense_by_id(expense_id)
    if not expense:
        return jsonify({"status": "error", "message": "Expense not found"}), 404
    return jsonify({"status": "success", "data": expense})


@app.route("/api/expenses", methods=["POST"])
def create_expense():
    """
    Creates a new expense.
    Expected JSON: { date, category, amount, description, payment_method }
    """
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data:
        return jsonify({"status": "error", "message": "Invalid request body"}), 400

    date = data.get("date", "")
    category = data.get("category", "Other")
    amount = data.get("amount")
    description = data.get("description", "")
    payment_method = data.get("payment_method", "Cash")

    if amount is None or amount == "":
        return jsonify({"status": "error", "message": "Amount is required"}), 400

    try:
        new_expense = expense_manager.add_expense(
            date=date,
            category=category,
            amount=amount,
            description=description,
            payment_method=payment_method
        )
        return jsonify({
            "status": "success",
            "message": "Expense added successfully",
            "data": new_expense
        }), 201
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


@app.route("/api/expenses/<expense_id>", methods=["PUT"])
def update_expense_endpoint(expense_id):
    """
    Updates an existing expense by ID.
    Expected JSON: { date, category, amount, description, payment_method }
    """
    data = request.get_json(silent=True) or request.form.to_dict()
    if not data:
        return jsonify({"status": "error", "message": "Invalid request body"}), 400

    date = data.get("date", "")
    category = data.get("category", "Other")
    amount = data.get("amount")
    description = data.get("description", "")
    payment_method = data.get("payment_method", "Cash")

    if amount is None or amount == "":
        return jsonify({"status": "error", "message": "Amount is required"}), 400

    try:
        updated = expense_manager.update_expense(
            expense_id=expense_id,
            date=date,
            category=category,
            amount=amount,
            description=description,
            payment_method=payment_method
        )
        return jsonify({
            "status": "success",
            "message": "Expense updated successfully",
            "data": updated
        })
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


@app.route("/api/expenses/<expense_id>", methods=["DELETE"])
def delete_expense_endpoint(expense_id):
    """Deletes an expense by ID."""
    try:
        expense_manager.delete_expense(expense_id)
        return jsonify({
            "status": "success",
            "message": "Expense deleted successfully"
        })
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500


@app.route("/api/summary", methods=["GET"])
def get_summary():
    """Returns analytics, KPIs, and chart data."""
    stats = expense_manager.get_summary_stats()
    return jsonify({
        "status": "success",
        "data": stats
    })


@app.route("/api/meta", methods=["GET"])
def get_meta():
    """Returns metadata like available categories and payment methods."""
    return jsonify({
        "status": "success",
        "categories": expense_manager.CATEGORIES,
        "payment_methods": expense_manager.PAYMENT_METHODS
    })


@app.route("/api/seed", methods=["POST"])
def seed_data():
    """Populates sample demonstration data."""
    try:
        expense_manager.seed_sample_data()
        return jsonify({
            "status": "success",
            "message": "Sample demonstration data loaded successfully"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/export-csv", methods=["GET"])
def export_csv():
    """Downloads expenses.csv directly."""
    expense_manager.ensure_csv_file()
    return send_file(
        expense_manager.FILE_NAME,
        mimetype="text/csv",
        as_attachment=True,
        download_name="expenses_export.csv"
    )


@app.route("/import-csv", methods=["POST"])
def import_csv():
    """Imports expenses from an uploaded CSV file."""
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "No file selected"}), 400

    try:
        stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
        reader = csv.DictReader(stream)
        imported_count = 0

        for row in reader:
            # Flexible key lookups
            date_val = row.get("Date") or row.get("date") or ""
            cat_val = row.get("Category") or row.get("category") or "Other"
            amt_val = row.get("Amount") or row.get("amount") or 0
            desc_val = row.get("Description") or row.get("description") or ""
            pm_val = row.get("PaymentMethod") or row.get("payment_method") or "Cash"

            try:
                if float(amt_val) > 0:
                    expense_manager.add_expense(date_val, cat_val, amt_val, desc_val, pm_val)
                    imported_count += 1
            except (ValueError, TypeError):
                continue

        return jsonify({
            "status": "success",
            "message": f"Successfully imported {imported_count} expense entries"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": f"Import failed: {str(e)}"}), 400


if __name__ == "__main__":
    expense_manager.ensure_csv_file()
    print("=" * 60)
    print(" Expense Management System Web Server")
    print(" Open your web browser and go to: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(debug=True, host="127.0.0.1", port=5000)
