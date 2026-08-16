/**
 * ExpenseHub - Expense Management System Web Application Logic
 * Capstone Project JavaScript Controller with Financial Calculators & Budget Tracker
 */

document.addEventListener("DOMContentLoaded", () => {
    // Application State
    const state = {
        expenses: [],
        categories: [],
        paymentMethods: [],
        summary: null,
        monthlyBudget: parseFloat(localStorage.getItem("expensehub_monthly_budget")) || 25000,
        currentFilter: "all",
        currentSearch: "",
        currentSort: "Date-desc",
        editingId: null,
        deletingId: null,
        categoryChartInstance: null,
        trendChartInstance: null,
        
        // Calculator State
        calc: {
            currentInput: "0",
            previousInput: "",
            operator: null,
            waitingForSecondOperand: false,
            history: ""
        }
    };

    // Category Color Mapping
    const categoryColors = {
        "Food & Dining": "#f97316",
        "Transportation": "#0284c7",
        "Utilities & Bills": "#8b5cf6",
        "Entertainment": "#ec4899",
        "Healthcare": "#10b981",
        "Shopping": "#eab308",
        "Education": "#6366f1",
        "Groceries": "#14b8a6",
        "Personal Care": "#06b6d4",
        "Other": "#64748b"
    };

    // DOM Elements
    const elements = {
        tableBody: document.getElementById("expense-table-body"),
        emptyState: document.getElementById("empty-state"),
        resultsCountBadge: document.getElementById("results-count-badge"),
        searchInput: document.getElementById("search-input"),
        clearSearchBtn: document.getElementById("clear-search-btn"),
        filterCategory: document.getElementById("filter-category"),
        sortSelect: document.getElementById("sort-select"),
        
        // KPIs
        kpiTotalAmount: document.getElementById("kpi-total-amount"),
        kpiTotalCount: document.getElementById("kpi-total-count"),
        kpiAvgAmount: document.getElementById("kpi-avg-amount"),
        kpiTopCategory: document.getElementById("kpi-top-category"),

        // Budget Banner
        budgetTargetVal: document.getElementById("budget-target-val"),
        budgetSpentVal: document.getElementById("budget-spent-val"),
        budgetRemainingVal: document.getElementById("budget-remaining-val"),
        budgetDailyVal: document.getElementById("budget-daily-val"),
        budgetProgressFill: document.getElementById("budget-progress-fill"),
        budgetProgressText: document.getElementById("budget-progress-text"),
        budgetStatusText: document.getElementById("budget-status-text"),
        budgetMonthLabel: document.getElementById("budget-month-label"),
        btnEditBudget: document.getElementById("btn-edit-budget"),
        budgetModal: document.getElementById("budget-modal"),
        btnCancelBudget: document.getElementById("btn-cancel-budget"),
        btnCloseBudgetModal: document.getElementById("btn-close-budget-modal"),
        budgetBackdrop: document.getElementById("budget-backdrop"),
        budgetForm: document.getElementById("budget-form"),
        inputBudgetTarget: document.getElementById("input-budget-target"),

        // Modals
        expenseModal: document.getElementById("expense-modal"),
        modalTitle: document.getElementById("modal-title"),
        expenseForm: document.getElementById("expense-form"),
        formExpenseId: document.getElementById("form-expense-id"),
        formDate: document.getElementById("form-date"),
        formAmount: document.getElementById("form-amount"),
        formCategory: document.getElementById("form-category"),
        formPayment: document.getElementById("form-payment"),
        formDescription: document.getElementById("form-description"),
        saveBtnText: document.getElementById("save-btn-text"),
        
        btnOpenAddModal: document.getElementById("btn-open-add-modal"),
        btnCloseModal: document.getElementById("btn-close-modal"),
        btnCancelModal: document.getElementById("btn-cancel-modal"),
        modalBackdrop: document.getElementById("modal-backdrop"),

        deleteModal: document.getElementById("delete-modal"),
        btnCloseDeleteModal: document.getElementById("btn-close-delete-modal"),
        btnCancelDelete: document.getElementById("btn-cancel-delete"),
        btnConfirmDelete: document.getElementById("btn-confirm-delete"),
        deleteBackdrop: document.getElementById("delete-backdrop"),
        deletePreviewContent: document.getElementById("delete-preview-content"),

        importModal: document.getElementById("import-modal"),
        btnImportModal: document.getElementById("btn-import-modal"),
        btnCloseImportModal: document.getElementById("btn-close-import-modal"),
        btnCancelImport: document.getElementById("btn-cancel-import"),
        importBackdrop: document.getElementById("import-backdrop"),
        importForm: document.getElementById("import-form"),
        csvFileInput: document.getElementById("csv-file-input"),

        // Calculator
        calcModal: document.getElementById("calc-modal"),
        btnOpenCalc: document.getElementById("btn-open-calc"),
        btnCloseCalc: document.getElementById("btn-close-calc"),
        calcBackdrop: document.getElementById("calc-backdrop"),
        calcDisplay: document.getElementById("calc-display"),
        calcHistory: document.getElementById("calc-history"),
        btnTransferCalc: document.getElementById("btn-transfer-calc"),

        // Splitter
        splitterModal: document.getElementById("splitter-modal"),
        btnOpenSplitter: document.getElementById("btn-open-splitter"),
        btnCloseSplitter: document.getElementById("btn-close-splitter"),
        btnCancelSplitter: document.getElementById("btn-cancel-splitter"),
        splitterBackdrop: document.getElementById("splitter-backdrop"),
        splitTotal: document.getElementById("split-total"),
        splitPeople: document.getElementById("split-people"),
        splitTip: document.getElementById("split-tip"),
        splitTax: document.getElementById("split-tax"),
        splitPerPerson: document.getElementById("split-per-person"),
        splitBaseShare: document.getElementById("split-base-share"),
        splitTipTotal: document.getElementById("split-tip-total"),
        splitTaxTotal: document.getElementById("split-tax-total"),
        splitGrandTotal: document.getElementById("split-grand-total"),
        btnSplitToExpense: document.getElementById("btn-split-to-expense"),

        btnSeedData: document.getElementById("btn-seed-data"),
        toastContainer: document.getElementById("toast-container")
    };

    // Helper: Currency Formatter
    function formatCurrency(num) {
        const val = parseFloat(num) || 0;
        return "₹" + val.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Helper: Toast Notifications
    function showToast(message, type = "success") {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        let iconSvg = "";
        if (type === "success") {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (type === "error") {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        } else {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `${iconSvg}<span>${message}</span>`;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(20px)";
            toast.style.transition = "all 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // Category CSS slug helper
    function getCategorySlug(categoryName) {
        return categoryName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    }

    // Fetch Metadata
    async function fetchMetadata() {
        try {
            const res = await fetch("/api/meta");
            const data = await res.json();
            if (data.status === "success") {
                state.categories = data.categories || [];
                state.paymentMethods = data.payment_methods || [];
                populateDropdowns();
            }
        } catch (err) {
            console.error("Error loading metadata:", err);
        }
    }

    function populateDropdowns() {
        // Filter dropdown
        elements.filterCategory.innerHTML = '<option value="all">All Categories</option>';
        state.categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            elements.filterCategory.appendChild(opt);
        });

        // Form category dropdown
        elements.formCategory.innerHTML = "";
        state.categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            elements.formCategory.appendChild(opt);
        });

        // Form payment method dropdown
        elements.formPayment.innerHTML = "";
        state.paymentMethods.forEach(pm => {
            const opt = document.createElement("option");
            opt.value = pm;
            opt.textContent = pm;
            elements.formPayment.appendChild(opt);
        });
    }

    // Fetch Analytics Summary and update KPIs, Budget, and Charts
    async function fetchSummary() {
        try {
            const res = await fetch("/api/summary");
            const resData = await res.json();
            if (resData.status === "success") {
                state.summary = resData.data;
                renderKPIs(state.summary);
                renderBudgetTracker(state.summary);
                renderCharts(state.summary);
            }
        } catch (err) {
            console.error("Error fetching summary:", err);
        }
    }

    // Render Budget Tracker
    function renderBudgetTracker(stats) {
        const now = new Date();
        const currentMonthKey = now.toISOString().slice(0, 7); // YYYY-MM
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        elements.budgetMonthLabel.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()} Progress`;

        // Calculate current month's spent amount
        let spentThisMonth = 0;
        if (stats && stats.chart_monthly && stats.chart_monthly.labels) {
            const idx = stats.chart_monthly.labels.indexOf(currentMonthKey);
            if (idx !== -1) {
                spentThisMonth = stats.chart_monthly.values[idx] || 0;
            }
        }

        const budget = state.monthlyBudget;
        const remaining = budget - spentThisMonth;
        const pctUsed = Math.min(Math.round((spentThisMonth / budget) * 100), 100);

        // Days left in current month
        const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysLeft = Math.max(totalDaysInMonth - now.getDate() + 1, 1);
        const safeDaily = remaining > 0 ? (remaining / daysLeft) : 0;

        elements.budgetTargetVal.textContent = formatCurrency(budget);
        elements.budgetSpentVal.textContent = formatCurrency(spentThisMonth);
        elements.budgetRemainingVal.textContent = formatCurrency(remaining);
        elements.budgetDailyVal.textContent = `${formatCurrency(safeDaily)}/day (${daysLeft} days left)`;
        elements.budgetProgressFill.style.width = `${pctUsed}%`;
        elements.budgetProgressText.textContent = `${pctUsed}% of monthly budget used`;

        // Style progress bar and remaining balance
        if (remaining < 0) {
            elements.budgetRemainingVal.className = "stat-val stat-danger";
            elements.budgetProgressFill.style.backgroundColor = "var(--danger)";
            elements.budgetStatusText.textContent = `Over budget by ${formatCurrency(Math.abs(remaining))}`;
            elements.budgetStatusText.style.color = "var(--danger)";
        } else if (pctUsed >= 85) {
            elements.budgetRemainingVal.className = "stat-val stat-warning";
            elements.budgetProgressFill.style.backgroundColor = "var(--warning)";
            elements.budgetStatusText.textContent = "Caution: Approaching Budget Limit";
            elements.budgetStatusText.style.color = "var(--warning)";
        } else {
            elements.budgetRemainingVal.className = "stat-val stat-positive";
            elements.budgetProgressFill.style.backgroundColor = "var(--primary)";
            elements.budgetStatusText.textContent = "Within Safe Spending Limit";
            elements.budgetStatusText.style.color = "var(--primary)";
        }
    }

    // Render KPI Metrics
    function renderKPIs(stats) {
        if (!stats) return;
        elements.kpiTotalAmount.textContent = formatCurrency(stats.total_expense);
        elements.kpiTotalCount.textContent = stats.transaction_count || 0;
        elements.kpiAvgAmount.textContent = formatCurrency(stats.average_expense);
        elements.kpiTopCategory.textContent = stats.top_category || "None";
    }

    // Render Visual Charts
    function renderCharts(stats) {
        if (typeof Chart === "undefined" || !stats) return;

        // 1. Spending by Category
        const catCanvas = document.getElementById("categoryChart");
        if (catCanvas) {
            const catCtx = catCanvas.getContext("2d");
            const catLabels = stats.chart_categories?.labels || [];
            const catValues = stats.chart_categories?.values || [];
            const backgroundColors = catLabels.map(label => categoryColors[label] || "#94a3b8");

            if (state.categoryChartInstance) {
                state.categoryChartInstance.destroy();
            }

            if (catLabels.length === 0) {
                state.categoryChartInstance = new Chart(catCtx, {
                    type: "doughnut",
                    data: {
                        labels: ["No Expenses Yet"],
                        datasets: [{ data: [1], backgroundColor: ["#e2e8f0"], borderWidth: 0 }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                        cutout: "70%"
                    }
                });
            } else {
                state.categoryChartInstance = new Chart(catCtx, {
                    type: "doughnut",
                    data: {
                        labels: catLabels,
                        datasets: [{
                            data: catValues,
                            backgroundColor: backgroundColors,
                            borderWidth: 2,
                            borderColor: "#ffffff"
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: "right",
                                labels: {
                                    boxWidth: 12,
                                    font: { family: "Plus Jakarta Sans", size: 11, weight: 500 },
                                    color: "#475569"
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: context => ` ${context.label}: ₹${context.raw.toLocaleString("en-IN")}`
                                }
                            }
                        },
                        cutout: "65%"
                    }
                });
            }
        }

        // 2. Monthly Trend Chart
        const trendCanvas = document.getElementById("trendChart");
        if (trendCanvas) {
            const trendCtx = trendCanvas.getContext("2d");
            const monthLabels = stats.chart_monthly?.labels || [];
            const monthValues = stats.chart_monthly?.values || [];

            if (state.trendChartInstance) {
                state.trendChartInstance.destroy();
            }

            state.trendChartInstance = new Chart(trendCtx, {
                type: "bar",
                data: {
                    labels: monthLabels.length > 0 ? monthLabels : ["No Data"],
                    datasets: [{
                        label: "Monthly Expenditure (₹)",
                        data: monthValues.length > 0 ? monthValues : [0],
                        backgroundColor: "#059669",
                        borderRadius: 6,
                        barThickness: 28,
                        maxBarThickness: 40
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: "#f1f5f9" },
                            ticks: {
                                font: { family: "Plus Jakarta Sans", size: 11 },
                                color: "#64748b",
                                callback: value => "₹" + value
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                font: { family: "Plus Jakarta Sans", size: 11 },
                                color: "#64748b"
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: context => ` Total: ₹${context.raw.toLocaleString("en-IN")}`
                            }
                        }
                    }
                }
            });
        }
    }

    // Fetch and Render Expenses List
    async function fetchExpenses() {
        const [sortBy, order] = state.currentSort.split("-");
        const query = new URLSearchParams({
            category: state.currentFilter,
            search: state.currentSearch,
            sort_by: sortBy,
            order: order || "desc"
        });

        try {
            const res = await fetch(`/api/expenses?${query.toString()}`);
            const data = await res.json();

            if (data.status === "success") {
                state.expenses = data.data || [];
                renderTable(state.expenses);
                elements.resultsCountBadge.textContent = `${state.expenses.length} ${state.expenses.length === 1 ? 'item' : 'items'}`;
            }
        } catch (err) {
            console.error("Error fetching expenses:", err);
            showToast("Failed to fetch expenses", "error");
        }
    }

    // Render Table Rows
    function renderTable(expenses) {
        elements.tableBody.innerHTML = "";

        if (expenses.length === 0) {
            elements.emptyState.style.display = "flex";
            return;
        }

        elements.emptyState.style.display = "none";

        expenses.forEach(exp => {
            const tr = document.createElement("tr");
            const catSlug = getCategorySlug(exp.category);

            tr.innerHTML = `
                <td><strong>${escapeHtml(exp.date)}</strong></td>
                <td>
                    <span class="category-tag cat-${catSlug}">
                        ${escapeHtml(exp.category)}
                    </span>
                </td>
                <td>${escapeHtml(exp.description)}</td>
                <td>
                    <span class="payment-badge">${escapeHtml(exp.payment_method || "Cash")}</span>
                </td>
                <td class="text-right amount-cell">${formatCurrency(exp.amount)}</td>
                <td class="text-center">
                    <div class="table-actions">
                        <button class="action-btn edit-btn" title="Edit expense" data-id="${exp.id}">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-btn delete-btn" title="Delete expense" data-id="${exp.id}">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </td>
            `;

            tr.querySelector(".edit-btn").addEventListener("click", () => openEditModal(exp));
            tr.querySelector(".delete-btn").addEventListener("click", () => openDeleteModal(exp));

            elements.tableBody.appendChild(tr);
        });
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Modal Control: Add New Expense
    window.openAddModal = function (prefillAmount = null, prefillCategory = null, prefillDesc = null) {
        state.editingId = null;
        elements.modalTitle.textContent = "Add New Expense";
        elements.saveBtnText.textContent = "Save Expense";
        elements.formExpenseId.value = "";
        elements.formDate.value = new Date().toISOString().split("T")[0];
        elements.formAmount.value = prefillAmount !== null ? prefillAmount : "";
        elements.formDescription.value = prefillDesc || "";
        
        if (prefillCategory && state.categories.includes(prefillCategory)) {
            elements.formCategory.value = prefillCategory;
        } else if (state.categories.length > 0) {
            elements.formCategory.value = state.categories[0];
        }

        if (state.paymentMethods.length > 0) {
            elements.formPayment.value = state.paymentMethods[0];
        }
        elements.expenseModal.classList.add("active");
    };

    function openEditModal(exp) {
        state.editingId = exp.id;
        elements.modalTitle.textContent = "Edit Expense";
        elements.saveBtnText.textContent = "Update Expense";
        elements.formExpenseId.value = exp.id;
        elements.formDate.value = exp.date;
        elements.formAmount.value = exp.amount;
        elements.formCategory.value = exp.category;
        elements.formPayment.value = exp.payment_method || "Cash";
        elements.formDescription.value = exp.description;
        elements.expenseModal.classList.add("active");
    }

    function closeExpenseModal() {
        elements.expenseModal.classList.remove("active");
        elements.expenseForm.reset();
        state.editingId = null;
    }

    function openDeleteModal(exp) {
        state.deletingId = exp.id;
        elements.deletePreviewContent.innerHTML = `
            <strong>${escapeHtml(exp.description)}</strong><br>
            Category: ${escapeHtml(exp.category)} | Date: ${escapeHtml(exp.date)}<br>
            Amount: <strong>${formatCurrency(exp.amount)}</strong>
        `;
        elements.deleteModal.classList.add("active");
    }

    function closeDeleteModal() {
        elements.deleteModal.classList.remove("active");
        state.deletingId = null;
    }

    function openImportModal() {
        elements.importModal.classList.add("active");
    }

    function closeImportModal() {
        elements.importModal.classList.remove("active");
        elements.importForm.reset();
    }

    // =========================================================================
    // Financial Calculator Logic
    // =========================================================================
    function openCalcModal() {
        elements.calcModal.classList.add("active");
    }

    function closeCalcModal() {
        elements.calcModal.classList.remove("active");
    }

    function updateCalcDisplay() {
        elements.calcDisplay.value = state.calc.currentInput;
        elements.calcHistory.textContent = state.calc.history;
    }

    function inputDigit(digit) {
        const { currentInput, waitingForSecondOperand } = state.calc;
        if (waitingForSecondOperand) {
            state.calc.currentInput = digit;
            state.calc.waitingForSecondOperand = false;
        } else {
            state.calc.currentInput = currentInput === "0" ? digit : currentInput + digit;
        }
        updateCalcDisplay();
    }

    function inputDecimal() {
        if (state.calc.waitingForSecondOperand) {
            state.calc.currentInput = "0.";
            state.calc.waitingForSecondOperand = false;
            updateCalcDisplay();
            return;
        }
        if (!state.calc.currentInput.includes(".")) {
            state.calc.currentInput += ".";
        }
        updateCalcDisplay();
    }

    function handleOperator(nextOperator) {
        const inputValue = parseFloat(state.calc.currentInput);

        if (state.calc.operator && state.calc.waitingForSecondOperand) {
            state.calc.operator = nextOperator;
            state.calc.history = `${state.calc.previousInput} ${getOperatorSymbol(nextOperator)}`;
            updateCalcDisplay();
            return;
        }

        if (state.calc.previousInput === "") {
            state.calc.previousInput = inputValue;
        } else if (state.calc.operator) {
            const currentValue = state.calc.previousInput || 0;
            const result = performCalculation(state.calc.operator, currentValue, inputValue);

            state.calc.currentInput = `${parseFloat(result.toFixed(4))}`;
            state.calc.previousInput = result;
        }

        state.calc.waitingForSecondOperand = true;
        state.calc.operator = nextOperator;
        state.calc.history = `${state.calc.previousInput} ${getOperatorSymbol(nextOperator)}`;
        updateCalcDisplay();
    }

    function getOperatorSymbol(op) {
        switch (op) {
            case "add": return "+";
            case "subtract": return "−";
            case "multiply": return "×";
            case "divide": return "÷";
            default: return "";
        }
    }

    function performCalculation(op, first, second) {
        switch (op) {
            case "add": return first + second;
            case "subtract": return first - second;
            case "multiply": return first * second;
            case "divide": return second !== 0 ? first / second : 0;
            default: return second;
        }
    }

    function calculateResult() {
        if (!state.calc.operator || state.calc.previousInput === "") return;

        const inputValue = parseFloat(state.calc.currentInput);
        const result = performCalculation(state.calc.operator, state.calc.previousInput, inputValue);

        state.calc.history = `${state.calc.previousInput} ${getOperatorSymbol(state.calc.operator)} ${inputValue} =`;
        state.calc.currentInput = `${parseFloat(result.toFixed(2))}`;
        state.calc.previousInput = "";
        state.calc.operator = null;
        state.calc.waitingForSecondOperand = true;
        updateCalcDisplay();
    }

    function clearCalc() {
        state.calc.currentInput = "0";
        state.calc.previousInput = "";
        state.calc.operator = null;
        state.calc.waitingForSecondOperand = false;
        state.calc.history = "";
        updateCalcDisplay();
    }

    function backspaceCalc() {
        if (state.calc.currentInput.length > 1) {
            state.calc.currentInput = state.calc.currentInput.slice(0, -1);
        } else {
            state.calc.currentInput = "0";
        }
        updateCalcDisplay();
    }

    function percentCalc() {
        const val = parseFloat(state.calc.currentInput);
        state.calc.currentInput = `${val / 100}`;
        updateCalcDisplay();
    }

    // Bind Calculator Keypad
    document.querySelectorAll(".calc-keypad .calc-key").forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.dataset.val) {
                if (btn.dataset.val === ".") {
                    inputDecimal();
                } else {
                    inputDigit(btn.dataset.val);
                }
            } else if (btn.dataset.action) {
                const act = btn.dataset.action;
                if (act === "clear") clearCalc();
                else if (act === "backspace") backspaceCalc();
                else if (act === "percent") percentCalc();
                else if (act === "calculate") calculateResult();
                else handleOperator(act);
            }
        });
    });

    elements.btnTransferCalc.addEventListener("click", () => {
        const calcVal = parseFloat(state.calc.currentInput);
        if (isNaN(calcVal) || calcVal <= 0) {
            showToast("Enter a valid amount first", "error");
            return;
        }
        closeCalcModal();
        openAddModal(calcVal.toFixed(2));
    });

    // =========================================================================
    // Bill Splitter Logic
    // =========================================================================
    function openSplitterModal() {
        calculateSplit();
        elements.splitterModal.classList.add("active");
    }

    function closeSplitterModal() {
        elements.splitterModal.classList.remove("active");
    }

    function calculateSplit() {
        const total = parseFloat(elements.splitTotal.value) || 0;
        const people = Math.max(parseInt(elements.splitPeople.value) || 1, 1);
        const tipPct = parseFloat(elements.splitTip.value) || 0;
        const taxPct = parseFloat(elements.splitTax.value) || 0;

        const tipAmount = total * (tipPct / 100);
        const taxAmount = total * (taxPct / 100);
        const grandTotal = total + tipAmount + taxAmount;
        const perPerson = people > 0 ? (grandTotal / people) : 0;
        const baseShare = people > 0 ? (total / people) : 0;

        elements.splitPerPerson.textContent = formatCurrency(perPerson);
        elements.splitBaseShare.textContent = formatCurrency(baseShare);
        elements.splitTipTotal.textContent = formatCurrency(tipAmount);
        elements.splitTaxTotal.textContent = formatCurrency(taxAmount);
        elements.splitGrandTotal.textContent = formatCurrency(grandTotal);

        return perPerson;
    }

    [elements.splitTotal, elements.splitPeople, elements.splitTip, elements.splitTax].forEach(el => {
        el.addEventListener("input", calculateSplit);
        el.addEventListener("change", calculateSplit);
    });

    elements.btnSplitToExpense.addEventListener("click", () => {
        const share = calculateSplit();
        if (share <= 0) {
            showToast("Please enter a valid bill total", "error");
            return;
        }
        closeSplitterModal();
        openAddModal(share.toFixed(2), "Food & Dining", "Group Bill Split share");
    });

    // =========================================================================
    // Budget Target Modal Logic
    // =========================================================================
    function openBudgetModal() {
        elements.inputBudgetTarget.value = state.monthlyBudget;
        elements.budgetModal.classList.add("active");
    }

    function closeBudgetModal() {
        elements.budgetModal.classList.remove("active");
    }

    elements.budgetForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newBudget = parseFloat(elements.inputBudgetTarget.value);
        if (isNaN(newBudget) || newBudget <= 0) {
            showToast("Please enter a valid budget amount", "error");
            return;
        }
        state.monthlyBudget = newBudget;
        localStorage.setItem("expensehub_monthly_budget", newBudget);
        renderBudgetTracker(state.summary);
        closeBudgetModal();
        showToast("Monthly budget updated successfully!", "success");
    });

    // Form Submission: Add / Edit Expense
    elements.expenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const amountVal = parseFloat(elements.formAmount.value);
        if (isNaN(amountVal) || amountVal <= 0) {
            showToast("Please enter a valid positive amount", "error");
            return;
        }

        const payload = {
            date: elements.formDate.value,
            amount: amountVal,
            category: elements.formCategory.value,
            payment_method: elements.formPayment.value,
            description: elements.formDescription.value.trim()
        };

        try {
            let res;
            if (state.editingId) {
                res = await fetch(`/api/expenses/${state.editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch("/api/expenses", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();
            if (res.ok && data.status === "success") {
                showToast(state.editingId ? "Expense updated successfully" : "Expense added successfully", "success");
                closeExpenseModal();
                await fetchExpenses();
                await fetchSummary();
            } else {
                showToast(data.message || "Failed to save expense", "error");
            }
        } catch (err) {
            console.error("Error saving expense:", err);
            showToast("Server error while saving expense", "error");
        }
    });

    // Handle Delete Execution
    elements.btnConfirmDelete.addEventListener("click", async () => {
        if (!state.deletingId) return;

        try {
            const res = await fetch(`/api/expenses/${state.deletingId}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (res.ok && data.status === "success") {
                showToast("Expense deleted successfully", "success");
                closeDeleteModal();
                await fetchExpenses();
                await fetchSummary();
            } else {
                showToast(data.message || "Failed to delete expense", "error");
            }
        } catch (err) {
            console.error("Error deleting expense:", err);
            showToast("Server error while deleting expense", "error");
        }
    });

    // Handle Import CSV Execution
    elements.importForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const file = elements.csvFileInput.files[0];
        if (!file) {
            showToast("Please choose a CSV file", "error");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/import-csv", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.status === "success") {
                showToast(data.message, "success");
                closeImportModal();
                await fetchExpenses();
                await fetchSummary();
            } else {
                showToast(data.message || "Import failed", "error");
            }
        } catch (err) {
            console.error("Error importing CSV:", err);
            showToast("Server error during import", "error");
        }
    });

    // Handle Seed Demo Data
    elements.btnSeedData.addEventListener("click", async () => {
        try {
            const res = await fetch("/api/seed", { method: "POST" });
            const data = await res.json();
            if (res.ok && data.status === "success") {
                showToast("Demo transactions generated!", "success");
                await fetchExpenses();
                await fetchSummary();
            } else {
                showToast(data.message || "Failed to load demo data", "error");
            }
        } catch (err) {
            console.error("Error seeding demo data:", err);
            showToast("Failed to seed demo data", "error");
        }
    });

    // Search and Filters
    let searchDebounceTimer;
    elements.searchInput.addEventListener("input", (e) => {
        clearTimeout(searchDebounceTimer);
        const val = e.target.value.trim();
        elements.clearSearchBtn.style.display = val ? "block" : "none";
        searchDebounceTimer = setTimeout(() => {
            state.currentSearch = val;
            fetchExpenses();
        }, 250);
    });

    elements.clearSearchBtn.addEventListener("click", () => {
        elements.searchInput.value = "";
        elements.clearSearchBtn.style.display = "none";
        state.currentSearch = "";
        fetchExpenses();
    });

    elements.filterCategory.addEventListener("change", (e) => {
        state.currentFilter = e.target.value;
        fetchExpenses();
    });

    elements.sortSelect.addEventListener("change", (e) => {
        state.currentSort = e.target.value;
        fetchExpenses();
    });

    // Bind Modal Toggle Events
    elements.btnOpenAddModal.addEventListener("click", () => openAddModal());
    elements.btnCloseModal.addEventListener("click", closeExpenseModal);
    elements.btnCancelModal.addEventListener("click", closeExpenseModal);
    elements.modalBackdrop.addEventListener("click", closeExpenseModal);

    elements.btnCloseDeleteModal.addEventListener("click", closeDeleteModal);
    elements.btnCancelDelete.addEventListener("click", closeDeleteModal);
    elements.deleteBackdrop.addEventListener("click", closeDeleteModal);

    elements.btnImportModal.addEventListener("click", openImportModal);
    elements.btnCloseImportModal.addEventListener("click", closeImportModal);
    elements.btnCancelImport.addEventListener("click", closeImportModal);
    elements.importBackdrop.addEventListener("click", closeImportModal);

    // Calculator Events
    elements.btnOpenCalc.addEventListener("click", openCalcModal);
    elements.btnCloseCalc.addEventListener("click", closeCalcModal);
    elements.calcBackdrop.addEventListener("click", closeCalcModal);

    // Splitter Events
    elements.btnOpenSplitter.addEventListener("click", openSplitterModal);
    elements.btnCloseSplitter.addEventListener("click", closeSplitterModal);
    elements.btnCancelSplitter.addEventListener("click", closeSplitterModal);
    elements.splitterBackdrop.addEventListener("click", closeSplitterModal);

    // Budget Events
    elements.btnEditBudget.addEventListener("click", openBudgetModal);
    elements.btnCloseBudgetModal.addEventListener("click", closeBudgetModal);
    elements.btnCancelBudget.addEventListener("click", closeBudgetModal);
    elements.budgetBackdrop.addEventListener("click", closeBudgetModal);

    // Initial Load
    async function init() {
        await fetchMetadata();
        await fetchSummary();
        await fetchExpenses();
    }

    init();
});
