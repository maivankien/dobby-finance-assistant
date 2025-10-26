// Expense Management Application
class ExpenseManager {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || []
        this.initializeEventListeners()
        this.setCurrentDateTime()
        this.renderExpenses()
        this.updateTotal()
    }

    initializeEventListeners() {
        // Add expense button
        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            this.showPopup()
        })

        // API Settings button
        document.getElementById('apiSettingsBtn').addEventListener('click', () => {
            window.location.href = 'src/api-settings/api-settings.html'
        })

        // Close popup buttons
        document.getElementById('closePopup').addEventListener('click', () => {
            this.hidePopup()
        })

        document.getElementById('dontSaveBtn').addEventListener('click', () => {
            this.hidePopup()
        })

        // Form submission
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault()
            this.saveExpense()
        })

        // Filter events
        document.getElementById('timeFilter').addEventListener('change', () => {
            this.toggleDateRangeInputs()
            this.renderExpenses()
            this.updateTotal()
        })

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.renderExpenses()
            this.updateTotal()
        })

        // Date range events
        document.getElementById('startDate').addEventListener('change', () => {
            this.renderExpenses()
            this.updateTotal()
        })

        document.getElementById('endDate').addEventListener('change', () => {
            this.renderExpenses()
            this.updateTotal()
        })

        // Close popup when clicking overlay
        document.getElementById('expensePopup').addEventListener('click', (e) => {
            if (e.target.id === 'expensePopup') {
                this.hidePopup()
            }
        })
    }

    setCurrentDateTime() {
        const now = new Date()
        const dateInput = document.getElementById('expenseDate')
        const timeInput = document.getElementById('expenseTime')

        // Set current date
        const dateString = now.toISOString().split('T')[0]
        dateInput.value = dateString

        // Set current time
        const timeString = now.toTimeString().split(' ')[0].substring(0, 5)
        timeInput.value = timeString
    }

    toggleDateRangeInputs() {
        const timeFilter = document.getElementById('timeFilter').value
        const dateRangeGroup = document.getElementById('dateRangeGroup')
        
        if (timeFilter === 'custom') {
            dateRangeGroup.style.display = 'flex'
            // Set default date range to current month
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            
            document.getElementById('startDate').value = startOfMonth.toISOString().split('T')[0]
            document.getElementById('endDate').value = endOfMonth.toISOString().split('T')[0]
        } else {
            dateRangeGroup.style.display = 'none'
        }
    }

    showPopup() {
        this.setCurrentDateTime()
        document.getElementById('expensePopup').classList.add('show')
        document.body.style.overflow = 'hidden'
    }

    hidePopup() {
        document.getElementById('expensePopup').classList.remove('show')
        document.body.style.overflow = 'auto'
        document.getElementById('expenseForm').reset()
    }

    saveExpense() {
        const formData = {
            id: Date.now(),
            date: document.getElementById('expenseDate').value,
            time: document.getElementById('expenseTime').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            category: document.getElementById('expenseCategory').value,
            note: document.getElementById('expenseNote').value
        }

        // Validate form
        if (!formData.amount || formData.amount <= 0) {
            alert('Please enter a valid amount')
            return
        }

        if (!formData.category) {
            alert('Please select a category')
            return
        }

        // Add expense
        this.expenses.unshift(formData)
        this.saveToLocalStorage()
        this.renderExpenses()
        this.updateTotal()
        this.hidePopup()
        this.showDoneNotification()
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id)
            this.saveToLocalStorage()
            this.renderExpenses()
            this.updateTotal()
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses))
    }

    getFilteredExpenses() {
        let filtered = [...this.expenses]

        const timeFilter = document.getElementById('timeFilter').value
        const now = new Date()

        if (timeFilter === 'today') {
            const today = now.toISOString().split('T')[0]
            filtered = filtered.filter(expense => expense.date === today)
        } else if (timeFilter === 'week') {
            const startOfWeek = new Date(now)
            const dayOfWeek = now.getDay()
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            startOfWeek.setDate(now.getDate() - daysToSubtract)
            startOfWeek.setHours(0, 0, 0, 0)

            const endOfWeek = new Date(startOfWeek)
            endOfWeek.setDate(startOfWeek.getDate() + 6)
            endOfWeek.setHours(23, 59, 59, 999)

            filtered = filtered.filter(expense => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= startOfWeek && expenseDate <= endOfWeek
            })
        } else if (timeFilter === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

            filtered = filtered.filter(expense => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= startOfMonth && expenseDate <= now
            })
        } else if (timeFilter === 'custom') {
            const startDate = document.getElementById('startDate').value
            const endDate = document.getElementById('endDate').value
            
            if (startDate && endDate) {
                const start = new Date(startDate)
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                
                filtered = filtered.filter(expense => {
                    const expenseDate = new Date(expense.date)
                    return expenseDate >= start && expenseDate <= end
                })
            }
        }

        const categoryFilter = document.getElementById('categoryFilter').value
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(expense => expense.category === categoryFilter)
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time)
            const dateB = new Date(b.date + ' ' + b.time)
            return dateB - dateA
        })

        return filtered
    }

    renderExpenses() {
        const expensesList = document.getElementById('expensesList')
        const filteredExpenses = this.getFilteredExpenses()

        if (filteredExpenses.length === 0) {
            expensesList.innerHTML = '<p class="no-expenses">No expenses found for the selected filters.</p>'
            return
        }

        expensesList.innerHTML = filteredExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-date">
                    <div>${this.formatDate(expense.date)}</div>
                    <div style="font-size: 0.9rem; color: #718096;">${expense.time}</div>
                </div>
                <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
                <div class="expense-category">${expense.category}</div>
                <div class="expense-note">${expense.note || 'No note'}</div>
                <button class="delete-btn" onclick="expenseManager.deleteExpense(${expense.id})">Delete</button>
            </div>
        `).join('')
    }

    updateTotal() {
        const filteredExpenses = this.getFilteredExpenses()
        const total = filteredExpenses.reduce((sum, expense) => {
            const amount = parseFloat(expense.amount) || 0
            return sum + amount
        }, 0)

        const totalElement = document.getElementById('totalAmount')
        totalElement.textContent = `$${total.toFixed(2)}`

        totalElement.style.transform = 'scale(1.05)'
        setTimeout(() => {
            totalElement.style.transform = 'scale(1)'
        }, 200)
    }

    formatDate(dateString) {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    showDoneNotification() {
        const notification = document.getElementById('doneNotification')
        notification.classList.add('show')

        setTimeout(() => {
            notification.classList.remove('show')
        }, 2000)
    }
}

const expenseManager = new ExpenseManager()
window.expenseManager = expenseManager
