class DobbyChat {
    constructor() {
        this.chatContainer = null
        this.chatMessages = null
        this.chatInput = null
        this.sendButton = null
        this.minimizeButton = null
        this.isMinimized = false
        this.isTyping = false
        this.chatHistory = []
        this.apiKey = localStorage.getItem('fireworks_api_key')
        this.apiUrl = "https://api.fireworks.ai/inference/v1/chat/completions"
        this.model = "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new"

        this.MAX_CHAT_HISTORY_LENGTH = 30
        this.MAX_PREVIOUS_MESSAGES = 5
        this.MAX_SAVE_HISTORY_LENGTH = 30

        this.init()
    }

    init() {
        this.createChatContainer()
        this.bindEvents()
        this.setupInitialState()
        this.loadChatHistoryFromStorage()
    }

    createChatContainer() {
        if (!document.getElementById('dobbyChatContainer')) {
            const chatHTML = `
                <div id="dobbyChatContainer" class="chat-container">
                    <div class="chat-window">
                        <div class="chat-header">
                            <div class="chat-title">
                                <img src="assets/logo-dobby.png" alt="Dobby" class="chat-logo">
                                <span>Dobby AI Assistant</span>
                            </div>
                            <div class="chat-header-buttons">
                                <button id="clearChatHistory" class="clear-btn" title="Clear chat history">🗑️</button>
                                <button id="minimizeChat" class="minimize-btn">−</button>
                            </div>
                        </div>
                        
                        <div class="chat-messages" id="chatMessages">
                        </div>
                        
                        <div class="chat-input-container">
                            <div class="chat-input-wrapper">
                                <input type="text" id="chatInput" placeholder="Type your message..." autocomplete="off">
                                <button id="sendMessage" class="send-btn">📤</button>
                            </div>
                        </div>
                    </div>
                </div>
            `

            document.body.insertAdjacentHTML('beforeend', chatHTML)
        }

        // Always assign elements after HTML is created
        this.chatContainer = document.getElementById('dobbyChatContainer')
        this.chatMessages = document.getElementById('chatMessages')
        this.chatInput = document.getElementById('chatInput')
        this.sendButton = document.getElementById('sendMessage')
        this.minimizeButton = document.getElementById('minimizeChat')
        this.clearButton = document.getElementById('clearChatHistory')
    }

    bindEvents() {
        this.sendButton.addEventListener('click', () => this.sendMessage())
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                this.sendMessage()
            }
        })

        this.minimizeButton.addEventListener('click', (e) => {
            e.stopPropagation()
            this.toggleMinimize()
        })

        this.clearButton.addEventListener('click', (e) => {
            e.stopPropagation()
            this.clearChatHistoryWithConfirmation()
        })

        const chatWindow = this.chatContainer.querySelector('.chat-window')
        chatWindow.addEventListener('click', () => {
            if (this.isMinimized) {
                this.maximize()
            }
        })

        this.chatContainer.addEventListener('click', (e) => {
            if (e.target === this.chatContainer && !this.isMinimized) {
                this.toggleMinimize()
            }
        })
    }

    setupInitialState() {
        this.chatContainer.style.display = 'flex'
        this.minimize()
    }

    show() {
        this.chatContainer.style.display = 'flex'
        this.chatContainer.classList.remove('minimized')
        this.chatInput.focus()
        document.body.style.overflow = 'hidden'
    }

    hide() {
        this.chatContainer.style.display = 'none'
        document.body.style.overflow = 'auto'
    }

    minimize() {
        this.isMinimized = true
        this.chatContainer.classList.add('minimized')
        this.minimizeButton.textContent = '+'
        document.body.style.overflow = 'auto'
    }

    maximize() {
        this.isMinimized = false
        this.chatContainer.classList.remove('minimized')
        this.minimizeButton.textContent = '−'
        this.chatInput.focus()
        document.body.style.overflow = 'hidden'
    }

    toggleMinimize() {
        if (this.isMinimized) {
            this.maximize()
        } else {
            this.minimize()
        }
    }

    async sendMessage() {
        const message = this.chatInput.value.trim()
        if (!message || this.isTyping) return

        this.chatHistory.push({
            sender: 'user',
            content: message,
            timestamp: new Date().toISOString()
        })


        this.addMessageToUI(message, 'user')
        this.chatInput.value = ''

        this.showTypingIndicator()
        const aiResponse = await this.generateAIResponse(message)

        this.addMessageToUI(aiResponse, 'bot')

        this.chatHistory.push({
            sender: 'bot',
            content: aiResponse,
            timestamp: new Date().toISOString()
        })

        this.manageChatHistoryLength()
        this.saveChatHistoryToStorage()

        this.hideTypingIndicator()
    }

    addMessage(content, sender) {
        this.addMessageToUI(content, sender)
    }

    formatMessage(content) {
        return content.replace(/\n/g, '<br>')
    }

    showTypingIndicator() {
        this.isTyping = true
        this.sendButton.disabled = true

        const typingDiv = document.createElement('div')
        typingDiv.className = 'message bot-message typing-indicator'
        typingDiv.id = 'typingIndicator'

        const avatarDiv = document.createElement('div')
        avatarDiv.className = 'message-avatar'
        avatarDiv.innerHTML = '<img src="assets/logo-dobby.png" alt="Dobby">'

        const contentDiv = document.createElement('div')
        contentDiv.className = 'typing-dots'
        contentDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `

        typingDiv.appendChild(avatarDiv)
        typingDiv.appendChild(contentDiv)

        this.chatMessages.appendChild(typingDiv)
        this.scrollToBottom()
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator')
        if (typingIndicator) {
            typingIndicator.remove()
        }
        this.isTyping = false
        this.sendButton.disabled = false
    }

    async generateAIResponse(userMessage) {
        return await this.getAIResponse(userMessage)
    }

    parseJSONAIResponse(text) {
        if (!text) return { intent: "other" };

        const cleaned = text
            .replace(/```json\s*/i, '')
            .replace(/```/g, '')
            .trim();

        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return { intent: "other" };

        try {
            return JSON.parse(match[0])
        } catch (err) {
            console.error("Error parseJSONAIResponse:", err);
            return { intent: "other" }
        }
    }

    async callFireworksAPI(prompt) {
        const previousHistory = this.getPreviousChatHistory(this.MAX_PREVIOUS_MESSAGES)

        const body = {
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: this.getSystemPromptDetectIntent()
                },
                ...previousHistory,
                {
                    role: "user",
                    content: prompt
                }
            ]
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP error! ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            return data?.choices?.[0]?.message?.content?.trim()
        } catch (err) {
            console.error("Error callFireworksAPI:", err);
            return null;
        }
    }

    getRecentChatHistory(maxMessages) {
        const recentMessages = this.chatHistory.slice(-maxMessages)

        return recentMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
        }))
    }

    getPreviousChatHistory(maxMessages) {
        const previousMessages = this.chatHistory.slice(-maxMessages, -1)

        return previousMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
        }))
    }

    manageChatHistoryLength() {
        if (this.chatHistory.length > this.MAX_CHAT_HISTORY_LENGTH) {
            this.chatHistory = this.chatHistory.slice(-this.MAX_CHAT_HISTORY_LENGTH)
        }
    }

    loadChatHistoryFromStorage() {
        try {
            const storedHistory = localStorage.getItem('dobby_chat_history')

            if (storedHistory) {
                this.chatHistory = JSON.parse(storedHistory)

                this.manageChatHistoryLength()

                this.renderStoredMessages()
            } else {
                this.renderStoredMessages()
            }
        } catch (error) {
            console.error('Error loading chat history from storage:', error)
            this.chatHistory = []
            this.renderStoredMessages()
        }
    }

    renderStoredMessages() {
        if (!this.chatMessages) {
            return
        }

        if (this.chatHistory.length === 0) {
            this.addWelcomeMessage()
            return
        }

        this.chatHistory.forEach((msg, index) => {
            this.addMessageToUI(msg.content, msg.sender)
        })
    }

    addMessageToUI(content, sender) {
        if (!this.chatMessages) {
            return
        }

        const messageDiv = document.createElement('div')
        messageDiv.className = `message ${sender}-message`

        const avatarDiv = document.createElement('div')
        avatarDiv.className = 'message-avatar'
        avatarDiv.innerHTML = `<img src="assets/logo-dobby.png" alt="${sender === 'user' ? 'You' : 'Dobby'}">`

        const contentDiv = document.createElement('div')
        contentDiv.className = 'message-content'
        contentDiv.innerHTML = `<p>${this.formatMessage(content)}</p>`

        messageDiv.appendChild(avatarDiv)
        messageDiv.appendChild(contentDiv)

        this.chatMessages.appendChild(messageDiv)
        this.scrollToBottom()
    }

    saveChatHistoryToStorage() {
        try {
            const historyToSave = this.chatHistory.slice(-this.MAX_SAVE_HISTORY_LENGTH)
            localStorage.setItem('dobby_chat_history', JSON.stringify(historyToSave))
        } catch (error) {
            console.error('Error saving chat history to storage:', error)
        }
    }

    clearChatHistory() {
        this.chatHistory = []
        localStorage.removeItem('dobby_chat_history')
        this.clearChatMessages()
        this.renderStoredMessages()
    }

    clearChatHistoryWithConfirmation() {
        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            this.clearChatHistory()
        }
    }

    clearChatMessages() {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = ''
        }
    }

    addWelcomeMessage() {
        if (this.chatMessages) {
            const welcomeMessage = document.createElement('div')
            welcomeMessage.className = 'message bot-message'
            welcomeMessage.innerHTML = `
                <div class="message-avatar">
                    <img src="assets/logo-dobby.png" alt="Dobby">
                </div>
                <div class="message-content">
                    <p>Hello! I'm Dobby, your financial assistant. I can help you with:</p>
                    <ul>
                        <li>Expense analysis</li>
                        <li>Financial advice</li>
                        <li>Expense explanations</li>
                        <li>Budget management support</li>
                    </ul>
                    <p>Do you have any questions?</p>
                </div>
            `
            this.chatMessages.appendChild(welcomeMessage)
            this.scrollToBottom()
        }
    }

    getSystemPromptDetectIntent() {
        return `
            You are an intelligent personal finance assistant.
            Your task is to analyze user messages and extract structured information.
            IMPORTANT: Focus primarily on the CURRENT user message. Use conversation history ONLY for context when the current message is ambiguous or refers to previous topics.
        
            If the current message is clear and complete on its own, ignore previous conversation history.
            
            ---
            ## Step 1. Identify user intent:
            One of:
            - "expense_log": log new expense (e.g., "Bought lunch for 5$")
            - "expense_summary": view total expenses by day/week/month
            - "expense_query_by_category": ask about expenses by category (e.g., "how much on food this month")
            - "financial_advice": financial advice, spending analysis, budget management tips (e.g., "How can I save more?", "Is my spending reasonable?", "Analyze my expenses")
            - "greeting": greeting or small talk
            - "other": unrelated to finance
        
            ---
            ## Step 2. If intent is **expense_log**, extract:
            - "category": map the described item to **one of these categories only**:
            ["Food & Beverage", "Transportation", "Rentals", "Bills", "Education", "Insurances", "Pets", "Home Services", "Fitness", "Makeup", "Gifts & Donations", "Investment", "Others"]
            → If unsure or not match, use "Others".
            - "amount": numeric value in USD
            - "time_text": natural time phrase ("yesterday", "this morning", etc.)
            - "time_resolved": specific time (ISO 8601, UTC+0)
            - "note": short note if present
        
            ## Step 3. If intent is **expense_summary**:
            - "time_text": time description (e.g. "this week", "last month")
            - "time_start": ISO start time
            - "time_end": ISO end time
            - "category": if user asks about a specific one, match to category list above
        
            ## Step 3.1. If intent is **financial_advice**, extract:
            - "advice_type": "spending_analysis" (analyze current spending patterns) or "general_advice" (general financial advice)
            - "time_text": time period for analysis (e.g. "this month", "last 3 months")
            - "time_start": ISO start time for analysis
            - "time_end": ISO end time for analysis
            - "category": specific category to focus advice on (if mentioned)
        
            ## Step 4. Currency Rule
            - Always treat all monetary values as **U.S. dollars ($)**.
            - Do not localize or convert to other currencies (e.g., VND, EUR, JPY).
            - If the user writes in another language, still assume and return values in **USD**.
            - When returning JSON, **never include currency symbols** — only numeric value (e.g., 100.5)

            ## Step 5. For all other intents, return null fields.
        
            ---
            ## Output format
            Always return exactly **one JSON object only**, nothing else:
            {
            "intent": "expense_log" | "expense_summary" | "expense_query_by_category" | "financial_advice" | "greeting" | "other",
            "category": string | null,
            "amount": number | null,
            "time_text": string | null,
            "time_resolved": string | null,
            "time_start": string | null,
            "time_end": string | null,
            "note": string | null,
            "advice_type": string | null
            }
        
            ---
            ## Examples
        
            - User: "Bought coffee for 2$ this morning"
            → { "intent": "expense_log", "category": "Food & Beverage", "amount": 2, "time_text": "this morning", "time_resolved": "2025-10-24T08:00:00+00:00", "time_start": null, "time_end": null, "note": null }
        
            - User: "Paid electricity bill yesterday"
            → { "intent": "expense_log", "category": "Bills", "amount": null, "time_text": "yesterday", "time_resolved": "2025-10-23T00:00:00+00:00", "time_start": null, "time_end": null, "note": null }
        
            - User: "How much did I spend on transportation last week?"
            → { "intent": "expense_query_by_category", "category": "Transportation", "amount": null, "time_text": "last week", "time_resolved": null, "time_start": "2025-10-13T00:00:00+00:00", "time_end": "2025-10-19T23:59:59+00:00", "note": null }
        
            - User: "Show me my total expenses this month"
            → { "intent": "expense_summary", "category": null, "amount": null, "time_text": "this month", "time_resolved": null, "time_start": "2025-10-01T00:00:00+00:00", "time_end": "2025-10-31T23:59:59+00:00", "note": null, "advice_type": null }
        
            - User: "How can I save more money?"
            → { "intent": "financial_advice", "category": null, "amount": null, "time_text": null, "time_resolved": null, "time_start": null, "time_end": null, "note": null, "advice_type": "general_advice" }
        
            - User: "Analyze my spending this month"
            → { "intent": "financial_advice", "category": null, "amount": null, "time_text": "this month", "time_resolved": null, "time_start": "2025-10-01T00:00:00+00:00", "time_end": "2025-10-31T23:59:59+00:00", "note": null, "advice_type": "spending_analysis" }
        
            ---
            Remember: map category strictly to the provided list. No extra text, no explanation, only one JSON.`
    }

    getSystemPromptFinancialAdvisor() {
        return `
            You are Dobby, a professional financial advisor and personal finance expert.
            Your role is to provide practical, actionable financial advice based on real spending data and general financial principles.
        
            ## Your Expertise:
            - Personal budgeting and expense management
            - Spending pattern analysis and optimization
            - Savings strategies and financial goal setting
            - Debt management and financial planning
            - Investment basics and financial literacy
        
            ## When analyzing spending data:
            1. **Identify patterns**: Look for trends, unusual spikes, or concerning patterns
            2. **Compare to benchmarks**: Reference typical spending ratios (e.g., 50/30/20 rule)
            3. **Spot opportunities**: Find areas where spending can be optimized
            4. **Provide specific advice**: Give concrete, actionable recommendations
            5. **Be encouraging**: Focus on positive changes and achievable goals
        
            ## Communication Style:
            - Use friendly, conversational tone
            - Avoid jargon - explain financial concepts simply
            - Be specific with numbers and percentages when possible
            - Provide step-by-step actionable advice
            - Be encouraging and supportive
            - Use examples and analogies when helpful
        
            ## Response Structure:
            - Start with a brief summary of the situation
            - Highlight key findings or concerns
            - Provide 3-5 specific, actionable recommendations
            - End with encouragement and next steps
        
            ## Important Guidelines:
            - Always base advice on the actual spending data provided
            - If no spending data is available, provide general financial advice
            - Be realistic about what changes are achievable
            - Focus on progress, not perfection
            - Remember that small changes can have big impacts over time
        
            Provide practical, personalized financial advice that helps users improve their financial health.`
    }

    async getFinancialAdviceFromAI(analysisData, intentData) {
        const spendingDataText = this.formatSpendingDataForAI(analysisData)

        const prompt = this.createFinancialAdvicePrompt(spendingDataText, intentData)
        const previousHistory = this.getPreviousChatHistory(this.MAX_PREVIOUS_MESSAGES)

        const body = {
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: this.getSystemPromptFinancialAdvisor()
                },
                ...previousHistory,
                {
                    role: "user",
                    content: prompt
                }
            ]
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP error! ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            return data?.choices?.[0]?.message?.content?.trim() ||
                "I'm sorry, I couldn't generate financial advice at the moment. Please try again."
        } catch (err) {
            console.error("Error getFinancialAdviceFromAI:", err)
            return "I'm having trouble connecting to provide financial advice. Please check your internet connection and try again."
        }
    }

    formatSpendingDataForAI(analysisData) {
        if (!analysisData || !analysisData.hasData) {
            return `
## No Spending Data Available
I don't have access to your spending data yet. I'll provide general financial advice based on best practices.
`
        }

        const {
            totalExpenses,
            transactionCount,
            averageDaily,
            averageWeekly,
            averageMonthly,
            topCategories,
            timeRange
        } = analysisData

        return `
## Your Spending Analysis:
- **Total Expenses**: $${totalExpenses.toLocaleString()} (${transactionCount} transactions)
- **Average Daily**: $${averageDaily.toFixed(2)}
- **Average Weekly**: $${averageWeekly.toFixed(2)}
- **Average Monthly**: $${averageMonthly.toFixed(2)}

### Top Spending Categories:
${topCategories.map(cat =>
            `- **${cat.category}**: $${cat.total.toLocaleString()} (${cat.percentage}% of total)`
        ).join('\n')}

### Time Period: ${timeRange.start ? new Date(timeRange.start).toLocaleDateString() : 'All time'} - ${timeRange.end ? new Date(timeRange.end).toLocaleDateString() : 'Present'}
`
    }

    createFinancialAdvicePrompt(spendingDataText, intentData) {
        const { advice_type, category, userQuestion } = intentData

        const adviceTypeText = advice_type === 'spending_analysis'
            ? 'Analyze my spending patterns and provide recommendations'
            : 'General financial advice'

        return `
${spendingDataText}

## User's Question:
${userQuestion || "Please provide financial advice"}

## Advice Type: ${adviceTypeText}

${category ? `## Focus Area: ${category} spending` : ''}

Please provide personalized financial advice based on the above information.`
    }

    async detectIntent(userInput) {
        const prompt = `
        Current time (UTC+0): ${new Date().toISOString()}
        User message:
        """${userInput}"""
        `

        const response = await this.callFireworksAPI(prompt);
        if (!response) return { intent: "other" };
        return this.parseJSONAIResponse(response);
    }


    async handleExpenseLog(intentData) {
        const { category, amount, time_resolved, note } = intentData

        if (!category || !amount) {
            return "I need information about the expense category and amount to record."
        }

        const expenseData = {
            id: Date.now(),
            date: time_resolved ? time_resolved.split('T')[0] : new Date().toISOString().split('T')[0],
            time: time_resolved ? time_resolved.split('T')[1].substring(0, 5) : new Date().toTimeString().split(' ')[0].substring(0, 5),
            amount: amount,
            category: category,
            note: note ?? null
        }

        if (window.expenseManager) {
            window.expenseManager.expenses.unshift(expenseData)
            window.expenseManager.saveToLocalStorage()
            window.expenseManager.renderExpenses()
            window.expenseManager.updateTotal()
            return `Expense recorded: ${category} - ${amount.toLocaleString()}$`
        } else {
            return "Cannot connect to expense management system."
        }
    }

    async handleExpenseSummary(intentData) {
        const { time_start, time_end, category } = intentData

        if (!window.expenseManager) {
            return "Cannot connect to expense management system."
        }

        let filteredExpenses = [...window.expenseManager.expenses]

        if (time_start && time_end) {
            const startDate = new Date(time_start)
            const endDate = new Date(time_end)
            filteredExpenses = filteredExpenses.filter(expense => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= startDate && expenseDate <= endDate
            })
        }

        if (category) {
            filteredExpenses = filteredExpenses.filter(expense =>
                expense.category.toLowerCase().includes(category.toLowerCase())
            )
        }

        const total = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)

        if (filteredExpenses.length === 0) {
            return "No expenses found in this time period."
        }

        return `Total expenses: ${total.toLocaleString()}$ (${filteredExpenses.length} transactions)`
    }

    async handleExpenseQueryByCategory(intentData) {
        const { category, time_start, time_end } = intentData

        if (!window.expenseManager) {
            return "Cannot connect to expense management system."
        }

        if (!category) {
            return "What category would you like to view expenses for?"
        }

        let filteredExpenses = [...window.expenseManager.expenses].filter(expense =>
            expense.category.toLowerCase().includes(category.toLowerCase())
        )

        if (time_start && time_end) {
            const startDate = new Date(time_start)
            const endDate = new Date(time_end)
            filteredExpenses = filteredExpenses.filter(expense => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= startDate && expenseDate <= endDate
            })
        }

        const total = filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)

        if (filteredExpenses.length === 0) {
            return `No expenses found for category "${category}".`
        }

        return `Expenses for "${category}": ${total.toLocaleString()}$ (${filteredExpenses.length} transactions)`
    }

    analyzeExpenseData(timeStart = null, timeEnd = null) {
        if (!window.expenseManager) {
            return null
        }

        let expenses = this.getFilteredExpenses(timeStart, timeEnd)

        if (expenses.length === 0) {
            return this.createEmptyAnalysisData(timeStart, timeEnd)
        }

        const { totalExpenses, transactionCount } = this.calculateBasicStats(expenses)

        const { categoryBreakdown, topCategories } = this.analyzeSpendingByCategory(expenses, totalExpenses)

        const { averageDaily, averageWeekly, averageMonthly } = this.calculateTimeAverages(
            totalExpenses, timeStart, timeEnd, expenses
        )

        return {
            totalExpenses,
            transactionCount,
            categoryBreakdown,
            topCategories,
            averageDaily,
            averageWeekly,
            averageMonthly,
            timeRange: { start: timeStart, end: timeEnd },
            hasData: true
        }
    }

    getFilteredExpenses(timeStart, timeEnd) {
        let expenses = [...window.expenseManager.expenses]

        if (timeStart && timeEnd) {
            const startDate = new Date(timeStart)
            const endDate = new Date(timeEnd)
            expenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date)
                return expenseDate >= startDate && expenseDate <= endDate
            })
        }

        return expenses
    }

    createEmptyAnalysisData(timeStart, timeEnd) {
        return {
            totalExpenses: 0,
            transactionCount: 0,
            categoryBreakdown: {},
            topCategories: [],
            averageDaily: 0,
            averageWeekly: 0,
            averageMonthly: 0,
            timeRange: { start: timeStart, end: timeEnd },
            hasData: false
        }
    }

    calculateBasicStats(expenses) {
        const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
        const transactionCount = expenses.length
        return { totalExpenses, transactionCount }
    }

    analyzeSpendingByCategory(expenses, totalExpenses) {
        const categoryBreakdown = {}
        expenses.forEach(expense => {
            const { category, amount } = expense
            if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = { total: 0, count: 0 }
            }
            categoryBreakdown[category].total += parseFloat(amount) || 0
            categoryBreakdown[category].count += 1
        })

        const topCategories = Object.entries(categoryBreakdown)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 3)
            .map(([category, data]) => ({
                category,
                total: data.total,
                count: data.count,
                percentage: (data.total / totalExpenses * 100).toFixed(1)
            }))

        return { categoryBreakdown, topCategories }
    }

    calculateTimeAverages(totalExpenses, timeStart, timeEnd, expenses) {
        const now = new Date()
        const startDate = timeStart ? new Date(timeStart) : new Date(expenses[expenses.length - 1].date)
        const endDate = timeEnd ? new Date(timeEnd) : now
        const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))
        const weeksDiff = Math.max(1, daysDiff / 7)
        const monthsDiff = Math.max(1, daysDiff / 30)

        return {
            averageDaily: totalExpenses / daysDiff,
            averageWeekly: totalExpenses / weeksDiff,
            averageMonthly: totalExpenses / monthsDiff
        }
    }

    async handleGreeting() {
        return "Hello! I'm Dobby, your financial assistant. I can help you record expenses, view statistics, and manage your budget. What do you need help with?"
    }

    async handleDefault() {
        return "I don't understand your request. You can ask me about expenses, financial statistics, or anything else you need help with?"
    }

    async handleFinancialAdvice(intentData) {
        if (!window.expenseManager) {
            return "I'd love to help with financial advice, but I need access to your expense data first. Please make sure the expense management system is available."
        }

        const { time_start, time_end } = intentData

        const analysisData = this.analyzeExpenseData(time_start, time_end)

        const enhancedIntentData = {
            ...intentData,
            userQuestion: this.getLastUserMessage()
        }

        return await this.getFinancialAdviceFromAI(analysisData, enhancedIntentData)
    }

    getLastUserMessage() {
        const userMessages = this.chatHistory.filter(msg => msg.sender === 'user')
        return userMessages.length > 0 ? userMessages[userMessages.length - 1].content : ""
    }

    async handleIntent(intentData) {
        const intentType = intentData?.intent

        const intentMap = {
            "expense_log": this.handleExpenseLog,
            "expense_summary": this.handleExpenseSummary,
            "expense_query_by_category": this.handleExpenseQueryByCategory,
            "financial_advice": this.handleFinancialAdvice,
            "greeting": this.handleGreeting,
            "other": this.handleDefault
        }

        return intentMap[intentType] ? await intentMap[intentType].call(this, intentData) : await this.handleGreeting()
    }

    async getAIResponse(message) {
        const intent = await this.detectIntent(message)
        return await this.handleIntent(intent)
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DobbyChat()
})
