@echo off
title Expense Management System - Web Server
echo ===================================================
echo   Starting ExpenseHub Web Application Server...
echo ===================================================
echo.
python -m pip install -r requirements.txt --quiet
echo Opening web server at http://127.0.0.1:5000
python app.py
pause
