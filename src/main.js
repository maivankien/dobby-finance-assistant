// Expense Management Application
class ExpenseManager {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || []
        this.currentView = 'list'
        this.calendarViewMode = 'month'
        const now = new Date()
        this.currentMonth = now.getUTCMonth()
        this.currentYear = now.getUTCFullYear()
        this.currentWeekStart = null
        this.selectedDate = null
        this.initializeEventListeners()
        this.setCurrentDateTime()
        this.updateViewVisibility()
        this.renderExpenses()
        this.updateTotal()
        this.renderCalendar()
    }

    initializeEventListeners() {
        // Add expense button
        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            this.showPopup()
        })

        // View switcher buttons
        document.getElementById('listViewBtn').addEventListener('click', () => {
            this.switchView('list')
        })

        document.getElementById('calendarViewBtn').addEventListener('click', () => {
            this.switchView('calendar')
        })

        // Calendar view mode buttons
        document.getElementById('calendarMonthViewBtn').addEventListener('click', () => {
            this.switchCalendarViewMode('month')
        })

        document.getElementById('calendarWeekViewBtn').addEventListener('click', () => {
            this.switchCalendarViewMode('week')
        })

        // Calendar navigation
        document.getElementById('calendarBackBtn').addEventListener('click', () => {
            if (this.calendarViewMode === 'week') {
                this.navigateWeek(-1)
            } else {
                this.navigateMonth(-1)
            }
        })

        document.getElementById('calendarTodayBtn').addEventListener('click', () => {
            this.goToToday()
        })

        document.getElementById('calendarNextBtn').addEventListener('click', () => {
            if (this.calendarViewMode === 'week') {
                this.navigateWeek(1)
            } else {
                this.navigateMonth(1)
            }
        })

        // Calendar popup controls
        document.getElementById('closeDayPopup').addEventListener('click', () => {
            this.hideDayPopup()
        })

        document.getElementById('dayExpensesPopup').addEventListener('click', (e) => {
            if (e.target.id === 'dayExpensesPopup') {
                this.hideDayPopup()
            }
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
            if (this.currentView === 'calendar') {
                this.renderCalendar()
            }
        })

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.renderExpenses()
            this.updateTotal()
            if (this.currentView === 'calendar') {
                this.renderCalendar()
            }
        })

        // Date range events
        document.getElementById('startDate').addEventListener('change', () => {
            this.renderExpenses()
            this.updateTotal()
            if (this.currentView === 'calendar') {
                this.renderCalendar()
            }
        })

        document.getElementById('endDate').addEventListener('change', () => {
            this.renderExpenses()
            this.updateTotal()
            if (this.currentView === 'calendar') {
                this.renderCalendar()
            }
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

        // Set current date in UTC
        const dateString = now.toISOString().split('T')[0]
        dateInput.value = dateString

        // Set current time in UTC
        const hours = String(now.getUTCHours()).padStart(2, '0')
        const minutes = String(now.getUTCMinutes()).padStart(2, '0')
        const timeString = `${hours}:${minutes}`
        timeInput.value = timeString
    }

    // Helper: Parse date string as UTC date (YYYY-MM-DD)
    parseUTCDate(dateString) {
        if (!dateString) return null
        const parts = dateString.split('-')
        if (parts.length !== 3) return null
        return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
    }

    // Helper: Get UTC date string (YYYY-MM-DD) from Date object
    getUTCDateString(date) {
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(date.getUTCDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Helper: Parse date and time as UTC
    parseUTCDateTime(dateString, timeString) {
        if (!dateString) return null
        const date = this.parseUTCDate(dateString)
        if (!date || !timeString) return date
        
        const timeParts = timeString.split(':')
        if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0]) || 0
            const minutes = parseInt(timeParts[1]) || 0
            date.setUTCHours(hours, minutes, 0, 0)
        }
        return date
    }

    truncateText(text, maxChars = 5) {
        if (!text) {
            return ''
        }

        if (text.length <= maxChars) {
            return text
        }

        if (maxChars <= 2) {
            return text.slice(0, maxChars)
        }

        return `${text.slice(0, maxChars - 2)}..`
    }

    toggleDateRangeInputs() {
        const timeFilter = document.getElementById('timeFilter').value
        const dateRangeGroup = document.getElementById('dateRangeGroup')
        
        if (timeFilter === 'custom') {
            dateRangeGroup.style.display = 'flex'
            // Set default date range to current month in UTC
            const now = new Date()
            const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
            const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
            
            document.getElementById('startDate').value = this.getUTCDateString(startOfMonth)
            document.getElementById('endDate').value = this.getUTCDateString(endOfMonth)
        } else {
            dateRangeGroup.style.display = 'none'
        }
    }

    updateViewVisibility() {
        const listViewBtn = document.getElementById('listViewBtn')
        const calendarViewBtn = document.getElementById('calendarViewBtn')
        const filterSection = document.querySelector('.filter-section')
        const summarySection = document.querySelector('.summary-section')
        const expensesSection = document.querySelector('.expenses-section')
        const calendarSection = document.getElementById('calendarSection')

        if (!listViewBtn || !calendarViewBtn || !expensesSection || !calendarSection || !filterSection || !summarySection) {
            return
        }

        if (this.currentView === 'calendar') {
            listViewBtn.classList.remove('active')
            calendarViewBtn.classList.add('active')
            filterSection.style.display = 'none'
            summarySection.style.display = 'none'
            expensesSection.style.display = 'none'
            calendarSection.style.display = 'block'
        } else {
            listViewBtn.classList.add('active')
            calendarViewBtn.classList.remove('active')
            filterSection.style.display = 'flex'
            summarySection.style.display = 'block'
            expensesSection.style.display = 'block'
            calendarSection.style.display = 'none'
        }
    }

    switchView(viewType) {
        if (this.currentView === viewType) {
            return
        }

        this.currentView = viewType
        this.updateViewVisibility()

        if (viewType === 'calendar') {
            this.renderCalendar()
        } else {
            this.renderExpenses()
        }
    }

    switchCalendarViewMode(mode) {
        if (this.calendarViewMode === mode) {
            return
        }

        this.calendarViewMode = mode

        const monthBtn = document.getElementById('calendarMonthViewBtn')
        const weekBtn = document.getElementById('calendarWeekViewBtn')
        const calendarSection = document.getElementById('calendarSection')

        if (monthBtn && weekBtn) {
            if (mode === 'month') {
                monthBtn.classList.add('active')
                weekBtn.classList.remove('active')
                if (calendarSection) {
                    calendarSection.classList.remove('week-view')
                }
            } else {
                monthBtn.classList.remove('active')
                weekBtn.classList.add('active')
                if (calendarSection) {
                    calendarSection.classList.add('week-view')
                }
            }
        }

        if (mode === 'week' && !this.currentWeekStart) {
            const today = new Date()
            const dayOfWeek = today.getUTCDay()
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            this.currentWeekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - daysToSubtract))
        }

        this.renderCalendar()
    }

    navigateMonth(direction) {
        this.currentMonth += direction

        if (this.currentMonth < 0) {
            this.currentMonth = 11
            this.currentYear -= 1
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0
            this.currentYear += 1
        }

        this.selectedDate = null
        this.renderCalendar()
    }

    navigateWeek(direction) {
        if (!this.currentWeekStart) {
            const today = new Date()
            const dayOfWeek = today.getUTCDay()
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            this.currentWeekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - daysToSubtract))
        }

        this.currentWeekStart.setUTCDate(this.currentWeekStart.getUTCDate() + (direction * 7))
        this.selectedDate = null
        this.renderCalendar()
    }

    goToToday() {
        const today = new Date()
        this.currentMonth = today.getUTCMonth()
        this.currentYear = today.getUTCFullYear()
        
        if (this.calendarViewMode === 'week') {
            const dayOfWeek = today.getUTCDay()
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            this.currentWeekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - daysToSubtract))
        }
        
        this.selectedDate = null
        this.renderCalendar()
    }

    selectDate(dateString) {
        this.selectedDate = dateString
        this.renderCalendar()
        this.showDateExpensesPopup(dateString)
    }

    getCalendarExpenses() {
        const calendarExpenses = [...this.expenses]

        calendarExpenses.sort((a, b) => {
            const dateA = this.parseUTCDateTime(a.date, a.time)
            const dateB = this.parseUTCDateTime(b.date, b.time)
            if (!dateA || !dateB) return 0
            return dateA - dateB
        })

        return calendarExpenses
    }

    renderCalendar() {
        if (this.calendarViewMode === 'week') {
            this.renderWeekCalendar()
        } else {
            this.renderMonthCalendar()
        }
    }

    renderMonthCalendar() {
        const calendarGrid = document.getElementById('calendarGrid')
        const monthLabel = document.getElementById('calendarCurrentMonth')

        if (!calendarGrid || !monthLabel) {
            return
        }

        const calendarExpenses = this.getCalendarExpenses()
        const expensesByDate = {}

        calendarExpenses.forEach(expense => {
            if (!expensesByDate[expense.date]) {
                expensesByDate[expense.date] = []
            }
            expensesByDate[expense.date].push(expense)
        })

        const firstDayOfMonth = new Date(Date.UTC(this.currentYear, this.currentMonth, 1))
        const gridStartDate = new Date(firstDayOfMonth)
        const firstWeekday = gridStartDate.getUTCDay()
        gridStartDate.setUTCDate(gridStartDate.getUTCDate() - firstWeekday)

        calendarGrid.innerHTML = ''

        const todayString = this.getUTCDateString(new Date())

        for (let i = 0; i < 42; i += 1) {
            const cellDate = new Date(gridStartDate)
            cellDate.setUTCDate(gridStartDate.getUTCDate() + i)
            const dateString = this.getUTCDateString(cellDate)
            const dayElement = this.createDayElement(cellDate, dateString, expensesByDate[dateString] || [], todayString)
            calendarGrid.appendChild(dayElement)
        }

        const monthDisplayDate = new Date(Date.UTC(this.currentYear, this.currentMonth, 1))
        monthLabel.textContent = monthDisplayDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC'
        })
    }

    renderWeekCalendar() {
        const calendarGrid = document.getElementById('calendarGrid')
        const monthLabel = document.getElementById('calendarCurrentMonth')

        if (!calendarGrid || !monthLabel) {
            return
        }

        if (!this.currentWeekStart) {
            const today = new Date()
            const dayOfWeek = today.getUTCDay()
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            this.currentWeekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - daysToSubtract))
        }

        const calendarExpenses = this.getCalendarExpenses()
        const expensesByDate = {}

        calendarExpenses.forEach(expense => {
            if (!expensesByDate[expense.date]) {
                expensesByDate[expense.date] = []
            }
            expensesByDate[expense.date].push(expense)
        })

        calendarGrid.innerHTML = ''

        const todayString = this.getUTCDateString(new Date())
        const weekStart = new Date(this.currentWeekStart)

        for (let i = 0; i < 7; i += 1) {
            const cellDate = new Date(weekStart)
            cellDate.setUTCDate(weekStart.getUTCDate() + i)
            const dateString = this.getUTCDateString(cellDate)
            const dayElement = this.createDayElement(cellDate, dateString, expensesByDate[dateString] || [], todayString)
            calendarGrid.appendChild(dayElement)
        }

        const weekEnd = new Date(weekStart)
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6)

        const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
        const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
        const startDay = weekStart.getUTCDate()
        const endDay = weekEnd.getUTCDate()
        const startYear = weekStart.getUTCFullYear()
        const endYear = weekEnd.getUTCFullYear()

        if (startMonth === endMonth && startYear === endYear) {
            monthLabel.textContent = `${startMonth} ${startDay} - ${endDay}, ${startYear}`
        } else if (startYear === endYear) {
            monthLabel.textContent = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`
        } else {
            monthLabel.textContent = `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`
        }
    }

    createDayElement(cellDate, dateString, dayExpenses, todayString) {
        const dayElement = document.createElement('div')
        dayElement.classList.add('calendar-day')

        if (dateString === todayString) {
            dayElement.classList.add('today')
        }

        if (this.selectedDate === dateString) {
            dayElement.classList.add('selected')
        }

        if (dayExpenses.length > 0) {
            dayElement.classList.add('has-expenses')
        }

        const totalAmount = this.getTotalAmountByDate(dateString, dayExpenses)
        const totalLabel = totalAmount > 0 ? `$${totalAmount.toFixed(2)}` : ''

        const previewResult = this.getExpensesPreviewByDate(dateString, 3, dayExpenses)
        const previewHtml = previewResult.preview.map(expense => {
            const amount = parseFloat(expense.amount) || 0
            const metaParts = [expense.time, expense.category].filter(Boolean)
            const metaText = metaParts.join(' • ')
            const amountLabel = this.truncateText(`$${amount.toFixed(2)}`, 6)
            const metaLabel = this.truncateText(metaText, 6)
            const combinedLabel = metaLabel ? `${amountLabel} • ${metaLabel}` : amountLabel

            return `
                <div class="calendar-expense-item">
                    <span class="calendar-expense-text">${combinedLabel}</span>
                </div>
            `
        }).join('')

        const moreHtml = previewResult.remaining > 0 ? `<div class="calendar-more-indicator">+${previewResult.remaining} more</div>` : ''

        dayElement.dataset.date = dateString
        dayElement.innerHTML = `
            <div class="calendar-day-header">
                <span class="calendar-date-number">${cellDate.getUTCDate()}</span>
                <span class="calendar-total-amount">${totalLabel}</span>
            </div>
            <div class="calendar-day-expenses">
                ${previewHtml}
            </div>
            ${moreHtml}
        `

        dayElement.addEventListener('click', () => {
            this.selectDate(dateString)
        })

        return dayElement
    }

    getExpensesByDate(dateString, sourceExpenses) {
        const expensesSource = Array.isArray(sourceExpenses) ? sourceExpenses : this.getFilteredExpenses()
        return expensesSource.filter(expense => expense.date === dateString)
    }

    getExpensesPreviewByDate(dateString, limit = 3, sourceExpenses) {
        const expenses = this.getExpensesByDate(dateString, sourceExpenses)
        const previewLimit = Number.isFinite(limit) ? limit : 3
        const preview = expenses.slice(0, previewLimit)
        const remaining = expenses.length > previewLimit ? expenses.length - previewLimit : 0

        return {
            preview,
            remaining
        }
    }

    getTotalAmountByDate(dateString, sourceExpenses) {
        const expenses = this.getExpensesByDate(dateString, sourceExpenses)
        return expenses.reduce((sum, expense) => {
            const amount = parseFloat(expense.amount) || 0
            return sum + amount
        }, 0)
    }

    showDateExpensesPopup(dateString) {
        const popup = document.getElementById('dayExpensesPopup')
        const title = document.getElementById('calendarPopupTitle')
        const content = document.getElementById('calendarPopupContent')

        if (!popup || !title || !content) {
            return
        }

        const expenses = this.getExpensesByDate(dateString, this.getCalendarExpenses())
        title.textContent = `Expenses • ${this.formatDate(dateString)}`

        if (expenses.length === 0) {
            content.innerHTML = '<p class="calendar-popup-empty">No expenses recorded for this day.</p>'
        } else {
            const itemsHtml = expenses.map(expense => {
                const amount = parseFloat(expense.amount) || 0
                const details = [expense.category, expense.note].filter(Boolean).join(' • ')

                return `
                    <div class="calendar-popup-expense">
                        <span class="calendar-popup-expense-time">${expense.time || '--:--'}</span>
                        <span class="calendar-popup-expense-category">${details || 'No details'}</span>
                        <span class="calendar-popup-expense-amount">$${amount.toFixed(2)}</span>
                    </div>
                `
            }).join('')

            content.innerHTML = itemsHtml
        }

        popup.classList.add('show')
        document.body.style.overflow = 'hidden'
    }

    hideDayPopup() {
        const popup = document.getElementById('dayExpensesPopup')

        if (!popup) {
            return
        }

        popup.classList.remove('show')
        document.body.style.overflow = 'auto'
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
        this.renderCalendar()
        this.hidePopup()
        this.showDoneNotification()
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id)
            this.saveToLocalStorage()
            this.renderExpenses()
            this.updateTotal()
            this.renderCalendar()
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
            const today = this.getUTCDateString(now)
            filtered = filtered.filter(expense => expense.date === today)
        } else if (timeFilter === 'week') {
            const dayOfWeek = now.getUTCDay()
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            
            const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysToSubtract, 0, 0, 0, 0))
            const endOfWeek = new Date(Date.UTC(startOfWeek.getUTCFullYear(), startOfWeek.getUTCMonth(), startOfWeek.getUTCDate() + 6, 23, 59, 59, 999))

            filtered = filtered.filter(expense => {
                const expenseDate = this.parseUTCDateTime(expense.date, expense.time)
                if (!expenseDate) return false
                return expenseDate >= startOfWeek && expenseDate <= endOfWeek
            })
        } else if (timeFilter === 'month') {
            const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
            const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))

            filtered = filtered.filter(expense => {
                const expenseDate = this.parseUTCDateTime(expense.date, expense.time)
                if (!expenseDate) return false
                return expenseDate >= startOfMonth && expenseDate <= endOfMonth
            })
        } else if (timeFilter === 'custom') {
            const startDate = document.getElementById('startDate').value
            const endDate = document.getElementById('endDate').value
            
            if (startDate && endDate) {
                const start = this.parseUTCDate(startDate)
                const end = this.parseUTCDate(endDate)
                if (start && end) {
                    end.setUTCHours(23, 59, 59, 999)
                    
                    filtered = filtered.filter(expense => {
                        const expenseDate = this.parseUTCDateTime(expense.date, expense.time)
                        if (!expenseDate) return false
                        return expenseDate >= start && expenseDate <= end
                    })
                }
            }
        }

        const categoryFilter = document.getElementById('categoryFilter').value
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(expense => expense.category === categoryFilter)
        }

        filtered.sort((a, b) => {
            const dateA = this.parseUTCDateTime(a.date, a.time)
            const dateB = this.parseUTCDateTime(b.date, b.time)
            if (!dateA || !dateB) return 0
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
        const date = this.parseUTCDate(dateString)
        if (!date) return dateString
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
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
