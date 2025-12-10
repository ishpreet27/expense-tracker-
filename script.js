let expenses = [];
let totalAmount = 0;
let monthlyBudget = 0;

// DOM elements
const categorySelect = document.getElementById("category-select");
const amountInput = document.getElementById("amount-input");
const dateInput = document.getElementById("date-input");
const addBtn = document.getElementById("add-btn");
const expensesTableBody = document.getElementById("expense-table-body");
const totalAmountCell = document.getElementById("total-amount");
const budgetInput = document.getElementById("monthly-budget");
const setBudgetBtn = document.getElementById("set-budget-btn");
const remainingBudgetDisplay = document.getElementById("remaining-budget-display");

const budgetProgressFill = document.getElementById("budget-progress-fill");
const budgetStatusText = document.getElementById("budget-status-text");

const downloadPdfBtn = document.getElementById("download-pdf-btn");
const themeToggleBtn = document.getElementById("theme-toggle");

const categoryListEl = document.getElementById("category-list");

let pieChart;

/* ========== THEME (DARK MODE) ========== */

(function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggleBtn.textContent = "☀️ Light Mode";
  } else {
    themeToggleBtn.textContent = "🌙 Dark Mode";
  }
})();

themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggleBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

/* ========== INPUT RESTRICTION ========== */

budgetInput.addEventListener("input", () => {
  budgetInput.value = budgetInput.value.replace(/[^0-9]/g, "");
});

amountInput.addEventListener("input", () => {
  amountInput.value = amountInput.value.replace(/[^0-9]/g, "");
});

/* ========== LOCAL STORAGE LOAD ========== */

window.addEventListener("DOMContentLoaded", () => {
  const savedExpenses = JSON.parse(localStorage.getItem("expenses")) || [];
  const savedBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

  expenses = savedExpenses;
  monthlyBudget = savedBudget;
  totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  totalAmountCell.textContent = totalAmount;
  budgetInput.value = monthlyBudget || "";
  updateRemainingBudget();
  renderTable();
  updateCharts();
  updateCategoryCards();
});

function saveData() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
  localStorage.setItem("monthlyBudget", monthlyBudget.toString());
}

/* ========== BUDGET & PROGRESS ========== */

setBudgetBtn.addEventListener("click", function () {
  const budgetValue = budgetInput.value.trim();

  if (!/^\d+$/.test(budgetValue) || Number(budgetValue) <= 0) {
    alert("Please enter a valid positive number for the monthly budget.");
    return;
  }

  monthlyBudget = Number(budgetValue);
  updateRemainingBudget();
  saveData();
  updateCategoryCards();
});

function updateRemainingBudget() {
  const remaining = monthlyBudget - totalAmount;
  remainingBudgetDisplay.textContent = `Remaining Budget: ₹${remaining}`;

  if (remaining < 0) {
    remainingBudgetDisplay.classList.add("remaining-negative");
  } else {
    remainingBudgetDisplay.classList.remove("remaining-negative");
  }

  updateBudgetProgress();
}

function updateBudgetProgress() {
  if (!monthlyBudget || monthlyBudget <= 0) {
    budgetProgressFill.style.width = "0%";
    budgetProgressFill.className = "progress-fill ok";
    budgetStatusText.textContent = "No budget set";
    return;
  }

  const usedPercent = (totalAmount / monthlyBudget) * 100;
  const clampedPercent = Math.min(usedPercent, 150);

  budgetProgressFill.style.width = clampedPercent + "%";

  budgetProgressFill.classList.remove("ok", "warning", "danger");

  if (usedPercent < 70) {
    budgetProgressFill.classList.add("ok");
  } else if (usedPercent <= 100) {
    budgetProgressFill.classList.add("warning");
  } else {
    budgetProgressFill.classList.add("danger");
  }

  const displayPercent = usedPercent.toFixed(1);
  budgetStatusText.textContent = `${displayPercent}% of budget used`;
}

/* ========== ADD / DELETE EXPENSES ========== */

addBtn.addEventListener("click", function () {
  const category = categorySelect.value;
  const amount = Number(amountInput.value);
  const date = dateInput.value;

  if (!category || isNaN(amount) || amount <= 0 || !date) {
    alert("Please fill all fields correctly.");
    return;
  }

  const expense = { category, amount, date };
  expenses.push(expense);
  totalAmount += amount;
  totalAmountCell.textContent = totalAmount;

  if (monthlyBudget > 0 && totalAmount > monthlyBudget) {
    alert("Warning: You are over your monthly budget!");
  }

  updateRemainingBudget();
  saveData();
  renderTable();
  updateCharts();
  updateCategoryCards();

  amountInput.value = "";
  dateInput.value = "";
});

function renderTable() {
  expensesTableBody.innerHTML = "";

  expenses.forEach((expense) => {
    const newRow = expensesTableBody.insertRow();
    const categoryCell = newRow.insertCell();
    const amountCell = newRow.insertCell();
    const dateCell = newRow.insertCell();
    const deleteCell = newRow.insertCell();

    categoryCell.textContent = expense.category;
    amountCell.textContent = expense.amount;
    dateCell.textContent = expense.date;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.addEventListener("click", function () {
      const index = expenses.indexOf(expense);
      if (index > -1) {
        expenses.splice(index, 1);
        totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        totalAmountCell.textContent = totalAmount;
        updateRemainingBudget();
        saveData();
        renderTable();
        updateCharts();
        updateCategoryCards();
      }
    });

    deleteCell.appendChild(deleteBtn);
  });
}

/* ========== PIE CHART ========== */

function updateCharts() {
  const dataToShow = expenses;

  if (!dataToShow || dataToShow.length === 0) {
    if (pieChart) pieChart.destroy();
    return;
  }

  const categoryTotals = {};
  dataToShow.forEach((exp) => {
    categoryTotals[exp.category] =
      (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);
  const totalForPercent = values.reduce((sum, v) => sum + v, 0);

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50"],
        },
      ],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw || 0;
              const percent = totalForPercent
                ? ((value / totalForPercent) * 100).toFixed(1)
                : 0;
              return `${label}: ₹${value} (${percent}%)`;
            },
          },
        },
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

/* ========== CATEGORY CARDS WITH RING ========== */

function getCategoryColor(category) {
  switch (category) {
    case "Food & Beverage":
      return "#FF6384";
    case "Stationary":
      return "#36A2EB";
    case "Transport":
      return "#FFCE56";
    case "Other":
      return "#4CAF50";
    default:
      return "#4CAF50";
  }
}

function updateCategoryCards() {
  if (!categoryListEl) return;

  categoryListEl.innerHTML = "";

  if (expenses.length === 0 || !monthlyBudget || monthlyBudget <= 0) {
    const p = document.createElement("p");
    p.textContent =
      "Add a monthly budget and some expenses to see category breakdown.";
    p.className = "category-empty";
    categoryListEl.appendChild(p);
    return;
  }

  const totals = {};
  const counts = {};

  expenses.forEach((exp) => {
    totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    counts[exp.category] = (counts[exp.category] || 0) + 1;
  });

  Object.keys(totals).forEach((cat) => {
    const total = totals[cat];
    const count = counts[cat];
    const percentOfBudget = (total / monthlyBudget) * 100;
    const color = getCategoryColor(cat);

    const card = document.createElement("div");
    card.className = "category-card";

    card.innerHTML = `
      <div class="category-ring" style="--percent:${percentOfBudget}%; --ring-color:${color};">
        <div class="ring-inner"></div>
      </div>
      <div class="category-info">
        <div class="category-top">
          <span class="category-name">${cat}</span>
          <span class="category-amount">₹${total.toFixed(2)}</span>
        </div>
        <div class="category-sub">
          <span>${percentOfBudget.toFixed(0)}% of budget</span>
          <span>${count} transaction${count > 1 ? "s" : ""}</span>
        </div>
      </div>
    `;

    categoryListEl.appendChild(card);
  });
}

/* ========== EXPORT AS PDF ONLY ========== */

downloadPdfBtn.addEventListener("click", () => {
  if (expenses.length === 0) {
    alert("No data to export.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Expenses Report", 14, 20);

  doc.setFontSize(12);
  doc.text(`Total: ₹${totalAmount}`, 14, 30);
  if (monthlyBudget > 0) {
    doc.text(`Budget: ₹${monthlyBudget}`, 14, 36);
  }

  let y = 48;

  doc.setFont(undefined, "bold");
  doc.text("Category", 14, y);
  doc.text("Amount", 80, y);
  doc.text("Date", 130, y);
  doc.setFont(undefined, "normal");

  y += 8;

  expenses.forEach((exp) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(exp.category, 14, y);
    doc.text("₹" + exp.amount, 80, y);
    doc.text(exp.date, 130, y);
    y += 8;
  });

  doc.save("expenses_report.pdf");
});
