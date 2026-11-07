// Pocketa — Simple Money Tracker
// Pure HTML, CSS, JavaScript using localStorage

(function () {
  'use strict';

  // Constants & Storage Key
  const STORAGE_KEY = 'pocketa_expenses';

  // DOM Elements
  const expenseForm = document.getElementById('expenseForm');
  const formTitle = document.getElementById('formTitle');
  const descInput = document.getElementById('description');
  const amountInput = document.getElementById('amount');
  const dateInput = document.getElementById('date');
  const submitBtnText = document.getElementById('submitBtnText');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  const descError = document.getElementById('descError');
  const amountError = document.getElementById('amountError');
  const dateError = document.getElementById('dateError');

  const totalAmountEl = document.getElementById('totalAmount');
  const totalCountEl = document.getElementById('totalCount');
  const expenseList = document.getElementById('expenseList');
  const emptyState = document.getElementById('emptyState');
  const emptyTitle = document.getElementById('emptyTitle');
  const emptyMessage = document.getElementById('emptyMessage');

  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  // Confirmation Modal Elements
  const confirmModal = document.getElementById('confirmModal');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');
  const modalMessage = document.getElementById('modalMessage');

  // App State
  let expenses = [];
  let editingId = null;
  let deletePendingId = null;
  let searchQuery = '';

  // Initialize
  function init() {
    loadExpenses();
    setDefaultDate();
    bindEvents();
    render();
  }

  // Set today's date in YYYY-MM-DD for the date input
  function setDefaultDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
  }

  // Load from localStorage
  function loadExpenses() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      expenses = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(expenses)) {
        expenses = [];
      }
    } catch (err) {
      console.error('Could not load expenses from localStorage:', err);
      expenses = [];
    }
  }

  // Save to localStorage
  function saveExpenses() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (err) {
      console.error('Could not save expenses to localStorage:', err);
      alert('Unable to save data. Your browser storage might be full or disabled.');
    }
  }

  // Format amount as currency (Naira)
  function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return '₦' + num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Format date string (YYYY-MM-DD) into readable format (e.g. Nov 7, 2026)
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      // Split to avoid UTC timezone offset shifting the day
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const dateObj = new Date(year, month, day);
        return dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  // Calculate and display total spent
  function updateTotalSummary(filteredCount = null) {
    const total = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    totalAmountEl.textContent = formatCurrency(total);
    const count = expenses.length;
    if (searchQuery && filteredCount !== null) {
      totalCountEl.textContent = `Showing ${filteredCount} of ${count} ${count === 1 ? 'expense' : 'expenses'}`;
    } else {
      totalCountEl.textContent = `${count} ${count === 1 ? 'expense' : 'expenses'} recorded`;
    }
  }

  // Form Validation
  function validateForm() {
    let isValid = true;
    clearErrors();

    const desc = descInput.value.trim();
    const amountVal = parseFloat(amountInput.value);
    const dateVal = dateInput.value;

    if (!desc) {
      showError(descInput, descError, 'Please describe what you spent on.');
      isValid = false;
    }

    if (isNaN(amountVal) || amountVal <= 0) {
      showError(amountInput, amountError, 'Please enter a valid amount greater than 0.');
      isValid = false;
    }

    if (!dateVal) {
      showError(dateInput, dateError, 'Please select a date.');
      isValid = false;
    }

    return isValid;
  }

  function showError(inputEl, errorEl, message) {
    inputEl.classList.add('input-error');
    errorEl.textContent = message;
  }

  function clearErrors() {
    [descInput, amountInput, dateInput].forEach(el => el.classList.remove('input-error'));
    [descError, amountError, dateError].forEach(el => el.textContent = '');
  }

  // Handle Form Submission (Add or Update)
  function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;

    if (editingId) {
      // Update existing
      const index = expenses.findIndex(item => item.id === editingId);
      if (index !== -1) {
        expenses[index] = {
          ...expenses[index],
          description,
          amount,
          date,
          updatedAt: Date.now()
        };
      }
      resetForm();
    } else {
      // Add new expense
      const newExpense = {
        id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        description,
        amount,
        date,
        createdAt: Date.now()
      };
      expenses.unshift(newExpense); // Put newly added on top
      resetForm();
    }

    saveExpenses();
    render();
  }

  // Start Editing an Expense
  function startEdit(id) {
    const item = expenses.find(exp => exp.id === id);
    if (!item) return;

    editingId = id;
    descInput.value = item.description;
    amountInput.value = item.amount;
    dateInput.value = item.date;

    formTitle.textContent = 'Edit Expense';
    submitBtnText.textContent = 'Save Changes';
    cancelEditBtn.classList.remove('hidden');

    clearErrors();

    // Scroll smoothly to form and focus description
    expenseForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    descInput.focus();

    renderList(); // Highlights the row currently being edited
  }

  // Cancel Editing
  function cancelEdit() {
    resetForm();
    renderList();
  }

  // Reset Form to initial state
  function resetForm() {
    editingId = null;
    expenseForm.reset();
    clearErrors();
    setDefaultDate();
    formTitle.textContent = 'Add New Expense';
    submitBtnText.textContent = '+ Add Expense';
    cancelEditBtn.classList.add('hidden');
  }

  // Open Delete Confirmation Modal
  function requestDelete(id) {
    const item = expenses.find(exp => exp.id === id);
    if (!item) return;

    deletePendingId = id;
    modalMessage.textContent = `Are you sure you want to delete "${item.description}" (${formatCurrency(item.amount)})? This cannot be undone.`;
    confirmModal.classList.remove('hidden');
    modalConfirmBtn.focus();
  }

  // Close Delete Confirmation Modal
  function closeDeleteModal() {
    deletePendingId = null;
    confirmModal.classList.add('hidden');
  }

  // Confirm Delete
  function confirmDelete() {
    if (!deletePendingId) return;

    const idToDelete = deletePendingId;
    expenses = expenses.filter(item => item.id !== idToDelete);

    if (editingId === idToDelete) {
      resetForm();
    }

    saveExpenses();
    closeDeleteModal();
    render();
  }

  // Search Filter
  function handleSearchInput(e) {
    searchQuery = e.target.value.trim().toLowerCase();
    if (searchQuery.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    renderList();
  }

  function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    searchInput.focus();
    renderList();
  }

  // Render Expense List & Empty State
  function renderList() {
    expenseList.innerHTML = '';

    // Sort expenses: newest spending date first; tie-breaker: newly created first
    const sortedExpenses = [...expenses].sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    // Filter by search query
    const filtered = sortedExpenses.filter(item => {
      if (!searchQuery) return true;
      const matchDesc = item.description.toLowerCase().includes(searchQuery);
      const matchDate = formatDate(item.date).toLowerCase().includes(searchQuery);
      return matchDesc || matchDate;
    });

    updateTotalSummary(filtered.length);

    if (expenses.length === 0) {
      // General empty state
      emptyTitle.textContent = 'Your pocket is peaceful!';
      emptyMessage.textContent = 'No expenses recorded yet. Use the form above to add your first expense.';
      emptyState.classList.remove('hidden');
      expenseList.classList.add('hidden');
      return;
    }

    if (filtered.length === 0) {
      // Empty search results
      emptyTitle.textContent = 'No matching expenses';
      emptyMessage.textContent = `No expenses found matching "${searchInput.value}". Check your spelling or clear the search.`;
      emptyState.classList.remove('hidden');
      expenseList.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    expenseList.classList.remove('hidden');

    // Create item DOM elements
    filtered.forEach(item => {
      const li = document.createElement('li');
      li.className = 'expense-item' + (item.id === editingId ? ' highlighted' : '');
      li.dataset.id = item.id;

      li.innerHTML = `
        <div class="expense-left">
          <span class="expense-desc">${escapeHtml(item.description)}</span>
          <span class="expense-date">${formatDate(item.date)}</span>
        </div>
        <div class="expense-right">
          <span class="expense-amount">-${formatCurrency(item.amount)}</span>
          <div class="expense-actions">
            <button type="button" class="action-btn edit-btn" title="Edit expense" aria-label="Edit ${escapeHtml(item.description)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button type="button" class="action-btn delete-btn" title="Delete expense" aria-label="Delete ${escapeHtml(item.description)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      `;

      // Event listeners for action buttons
      const editBtn = li.querySelector('.edit-btn');
      editBtn.addEventListener('click', () => startEdit(item.id));

      const deleteBtn = li.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => requestDelete(item.id));

      expenseList.appendChild(li);
    });
  }

  // Prevent XSS in HTML template injection
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Render everything
  function render() {
    updateTotalSummary();
    renderList();
  }

  // Bind Event Listeners
  function bindEvents() {
    expenseForm.addEventListener('submit', handleFormSubmit);
    cancelEditBtn.addEventListener('click', cancelEdit);

    // Search events
    searchInput.addEventListener('input', handleSearchInput);
    clearSearchBtn.addEventListener('click', clearSearch);

    // Modal events
    modalCancelBtn.addEventListener('click', closeDeleteModal);
    modalConfirmBtn.addEventListener('click', confirmDelete);

    // Dismiss modal on backdrop click
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        closeDeleteModal();
      }
    });

    // Dismiss modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !confirmModal.classList.contains('hidden')) {
        closeDeleteModal();
      }
    });

    // Clear field errors as user types
    descInput.addEventListener('input', () => {
      descInput.classList.remove('input-error');
      descError.textContent = '';
    });

    amountInput.addEventListener('input', () => {
      amountInput.classList.remove('input-error');
      amountError.textContent = '';
    });

    dateInput.addEventListener('input', () => {
      dateInput.classList.remove('input-error');
      dateError.textContent = '';
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

