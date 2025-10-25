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
            You can use previous messages (conversation history) to understand the user's intent and maintain context during the conversation.
        
            ---
            ## Step 1. Identify user intent:
            One of:
            - "expense_log": log new expense (e.g., "Bought lunch for 5$")
            - "expense_summary": view total expenses by day/week/month
            - "expense_query_by_category": ask about expenses by category (e.g., "how much on food this month")
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
            "intent": "expense_log" | "expense_summary" | "expense_query_by_category" | "greeting" | "other",
            "category": string | null,
            "amount": number | null,
            "time_text": string | null,
            "time_resolved": string | null,
            "time_start": string | null,
            "time_end": string | null,
            "note": string | null
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
            → { "intent": "expense_summary", "category": null, "amount": null, "time_text": "this month", "time_resolved": null, "time_start": "2025-10-01T00:00:00+00:00", "time_end": "2025-10-31T23:59:59+00:00", "note": null }
        
            ---
            Remember: map category strictly to the provided list. No extra text, no explanation, only one JSON.`
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

    async handleGreeting() {
        return "Hello! I'm Dobby, your financial assistant. I can help you record expenses, view statistics, and manage your budget. What do you need help with?"
    }

    async handleDefault() {
        return "I don't understand your request. You can ask me about expenses, financial statistics, or anything else you need help with?"
    }

    async handleIntent(intentData) {
        const intentType = intentData?.intent

        const intentMap = {
            "expense_log": this.handleExpenseLog,
            "expense_summary": this.handleExpenseSummary,
            "expense_query_by_category": this.handleExpenseQueryByCategory,
            "greeting": this.handleGreeting,
            "other": this.handleDefault
        }

        return intentMap[intentType] ? await intentMap[intentType](intentData) : await this.handleGreeting()
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
