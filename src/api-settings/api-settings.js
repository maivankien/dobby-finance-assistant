// API Settings Management
class ApiSettingsManager {
    constructor() {
        this.apiKey = localStorage.getItem('fireworks_api_key') || ''
        this.initializeEventListeners()
        this.loadSavedKey()
        this.updateStatus()
    }

    initializeEventListeners() {
        // Back button
        const backBtn = document.getElementById('backBtn')
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = '../../index.html'
            })
        }

        // Form submission
        const apiForm = document.getElementById('apiForm')
        if (apiForm) {
            apiForm.addEventListener('submit', (e) => {
                e.preventDefault()
                this.saveApiKey()
            })
        }

        // Toggle visibility
        const toggleVisibility = document.getElementById('toggleVisibility')
        if (toggleVisibility) {
            toggleVisibility.addEventListener('click', () => {
                this.toggleVisibility()
            })
        }

        // Clear key
        const clearKey = document.getElementById('clearKey')
        if (clearKey) {
            clearKey.addEventListener('click', () => {
                this.clearKey()
            })
        }

        // Test connection
        const testConnection = document.getElementById('testConnection')
        if (testConnection) {
            testConnection.addEventListener('click', () => {
                this.testConnection()
            })
        }

        // Input change
        const apiKey = document.getElementById('apiKey')
        if (apiKey) {
            apiKey.addEventListener('input', () => {
                this.updateStatus()
            })
        }
    }

    loadSavedKey() {
        if (this.apiKey) {
            const apiKeyInput = document.getElementById('apiKey')
            if (apiKeyInput) {
                apiKeyInput.value = this.apiKey
                this.updateStatus()
            }
        }
    }

    toggleVisibility() {
        const input = document.getElementById('apiKey')
        const button = document.getElementById('toggleVisibility')
        
        if (input && button) {
            if (input.type === 'password') {
                input.type = 'text'
                button.textContent = '🙈 Hide'
            } else {
                input.type = 'password'
                button.textContent = '👁️ Show'
            }
        }
    }

    clearKey() {
        if (confirm('Are you sure you want to clear the API key?')) {
            const apiKeyInput = document.getElementById('apiKey')
            if (apiKeyInput) {
                apiKeyInput.value = ''
            }
            this.apiKey = ''
            localStorage.removeItem('fireworks_api_key')
            this.updateStatus()
            this.showSuccessNotification('API key cleared successfully!')
        }
    }

    saveApiKey() {
        const apiKeyInput = document.getElementById('apiKey')
        if (!apiKeyInput) return
        
        const newApiKey = apiKeyInput.value.trim()
        
        if (!newApiKey) {
            this.showErrorNotification('Please enter a valid API key')
            return
        }

        // Basic validation - check if it looks like a valid API key
        if (newApiKey.length < 10) {
            this.showErrorNotification('API key seems too short. Please check and try again.')
            return
        }

        try {
            this.apiKey = newApiKey
            localStorage.setItem('fireworks_api_key', newApiKey)
            this.updateStatus()
            this.showSuccessNotification('API key saved successfully!')
        } catch (error) {
            console.error('Error saving API key:', error)
            this.showErrorNotification('Failed to save API key. Please try again.')
        }
    }

    async testConnection() {
        const apiKeyInput = document.getElementById('apiKey')
        if (!apiKeyInput) return
        
        const currentApiKey = apiKeyInput.value.trim()
        
        if (!currentApiKey) {
            this.showErrorNotification('Please enter an API key first')
            return
        }
    
        const button = document.getElementById('testConnection')
        if (!button) return
        
        const originalText = button.textContent
        button.textContent = 'Testing...'
        button.disabled = true
    
        try {
            const response = await fetch('https://api.fireworks.ai/inference/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentApiKey}`,
                    'Content-Type': 'application/json',
                },
            })
    
            if (!response.ok) {
                throw new Error(`Connection failed (${response.status})`)
            }
    
            const data = await response.json()
    
            if (Array.isArray(data?.data)) {
                this.showSuccessNotification('Connection successful! API key is valid.')
                this.updateStatus(true)
            } else {
                this.showErrorNotification('Unexpected response. Please check your API key.')
                this.updateStatus(false)
            }
        } catch (error) {
            console.error('API verification error:', error)
            this.showErrorNotification('Connection failed. Please check your API key.')
            this.updateStatus(false)
        } finally {
            button.textContent = originalText
            button.disabled = false
        }
    }
    

    updateStatus(isConnected = null) {
        const statusDot = document.querySelector('.status-dot')
        const statusText = document.querySelector('.status-text')
        const apiKeyInput = document.getElementById('apiKey')
        
        if (!statusDot || !statusText || !apiKeyInput) return
        
        const currentKey = apiKeyInput.value.trim()

        if (currentKey) {
            if (isConnected === true) {
                statusDot.classList.add('connected')
                statusText.textContent = 'Connected and verified'
            } else if (isConnected === false) {
                statusDot.classList.remove('connected')
                statusText.textContent = 'Connection failed'
            } else {
                statusDot.classList.remove('connected')
                statusText.textContent = 'API key configured (not tested)'
            }
        } else {
            statusDot.classList.remove('connected')
            statusText.textContent = 'No API key configured'
        }
    }

    showSuccessNotification(message) {
        const notification = document.getElementById('successNotification')
        if (!notification) return
        
        const textElement = notification.querySelector('.notification-text')
        if (textElement) {
            textElement.textContent = message
        }
        notification.style.display = 'block'
        
        setTimeout(() => {
            notification.style.display = 'none'
        }, 3000)
    }

    showErrorNotification(message) {
        const notification = document.getElementById('errorNotification')
        const textElement = notification.querySelector('.notification-text')
        textElement.textContent = message
        notification.style.display = 'block'
        
        setTimeout(() => {
            notification.style.display = 'none'
        }, 3000)
    }
}

// Initialize the API settings manager when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ApiSettingsManager()
    })
} else {
    // DOM is already loaded
    new ApiSettingsManager()
}
