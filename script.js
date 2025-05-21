let expenses = [];
let totalAmount = 0;
let monthlyBudget = 0;

const categorySelect = document.getElementById('category-select');
const amountInput = document.getElementById('amount-input');
const dateInput = document.getElementById('date-input');
const addBtn = document.getElementById('add-btn');
const expensesTableBody = document.getElementById('expnese-table-body');
const totalAmountCell = document.getElementById('total-amount');
const budgetInput = document.getElementById('monthly-budget');
const setBudgetBtn = document.getElementById('set-budget-btn');
const remainingBudgetDisplay = document.getElementById('remaining-budget-display');

let pieChart, barChart;

// Restrict non-numeric characters in budget and amount inputs
budgetInput.addEventListener('input', () => {
  budgetInput.value = budgetInput.value.replace(/[^0-9]/g, '');
});

amountInput.addEventListener('input', () => {
  amountInput.value = amountInput.value.replace(/[^0-9]/g, '');
});

setBudgetBtn.addEventListener('click', function () {
  const budgetValue = budgetInput.value.trim();

  if (!/^\d+$/.test(budgetValue) || Number(budgetValue) <= 0) {
    alert('Please enter a valid positive number for the monthly budget.');
    return;
  }

  monthlyBudget = Number(budgetValue);
  updateRemainingBudget();
});

function updateRemainingBudget() {
  const remaining = monthlyBudget - totalAmount;
  remainingBudgetDisplay.textContent = `Remaining Budget: ₹${remaining}`;
}

function updateCharts() {
  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Expenses by Category',
        data,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50'],
      }]
    }
  });

  const previousMonthData = labels.map(() => Math.floor(Math.random() * 500));

  if (barChart) barChart.destroy();
  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'This Month',
          data,
          backgroundColor: '#4CAF50'
        },
        {
          label: 'Previous Month',
          data: previousMonthData,
          backgroundColor: '#f44336'
        }
      ]
    }
  });
}

addBtn.addEventListener('click', function () {
  const category = categorySelect.value;
  const amount = Number(amountInput.value);
  const date = dateInput.value;

  if (!category || isNaN(amount) || amount <= 0 || !date) {
    alert('Please fill all fields correctly.');
    return;
  }

  if ((totalAmount + amount) > monthlyBudget) {
    alert('This expense exceeds your monthly budget!');
    return;
  }

  const expense = { category, amount, date };
  expenses.push(expense);
  totalAmount += amount;
  totalAmountCell.textContent = totalAmount;

  updateRemainingBudget();
  updateCharts();

  const newRow = expensesTableBody.insertRow();
  const categoryCell = newRow.insertCell();
  const amountCell = newRow.insertCell();
  const dateCell = newRow.insertCell();
  const deleteCell = newRow.insertCell();

  categoryCell.textContent = category;
  amountCell.textContent = amount;
  dateCell.textContent = date;

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.classList.add('delete-btn');
  deleteBtn.addEventListener('click', function () {
    expenses.splice(expenses.indexOf(expense), 1);
    totalAmount -= amount;
    totalAmountCell.textContent = totalAmount;
    expensesTableBody.removeChild(newRow);
    updateRemainingBudget();
    updateCharts();
  });

  deleteCell.appendChild(deleteBtn);

  amountInput.value = '';
  dateInput.value = '';
});
