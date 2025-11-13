# Dobby Finance Assistant

A modern web application for personal expense tracking with AI-powered financial assistance.

## Overview

Dobby Finance Assistant is a comprehensive personal finance management application that helps users track their daily expenses with an intuitive interface. The application features a popup-based expense entry system, comprehensive filtering options, real-time expense calculations, calendar view with month and week modes, and an AI-powered chat assistant that can help with expense logging, financial analysis, and budgeting advice.

## Features

### Core Functionality
- **Expense Entry**: Quick expense logging through a modal popup with date/time selection
- **Category Management**: 13 predefined expense categories
- **Advanced Filtering**: Filter expenses by time periods (Today, This Week, This Month, Custom Range) and categories
- **Calendar View**: Visual calendar interface with month and week display modes
- **View Switching**: Toggle between list view and calendar view
- **Real-time Totals**: Automatic calculation of total expenses with visual feedback
- **Data Persistence**: Local storage for data retention across sessions
- **Expense History**: Complete transaction history with delete functionality
- **AI Chat Assistant**: Intelligent financial assistant powered by Fireworks AI
- **API Key Management**: Secure configuration for AI services

### AI-Powered Features
- **Natural Language Expense Logging**: Record expenses through conversational input
- **Financial Analysis**: AI-powered spending pattern analysis and recommendations
- **Budget Management**: Personalized financial advice and budgeting tips
- **Expense Queries**: Ask questions about spending by category or time period
- **Smart Intent Recognition**: Automatically detects user intent and responds appropriately

### User Interface
- **Responsive Design**: Mobile-friendly layout with adaptive components
- **Modern UI**: Rounded corners, gradients, and smooth animations
- **Visual Feedback**: "Done" notification after saving expenses
- **Interactive Elements**: Hover effects and smooth transitions
- **Calendar Interface**: Month and week calendar views with expense previews
- **Minimizable Chat**: Collapsible AI assistant interface
- **Multi-page Navigation**: Dedicated API settings page

## Technical Architecture

### File Structure
```
dobby-finance-assistant/
├── index.html                    # Main HTML structure
├── src/
│   ├── main.css                  # Main application styling
│   ├── main.js                   # Core expense management logic
│   ├── api-settings/             # API configuration module
│   │   ├── api-settings.html     # API settings page
│   │   ├── api-settings.css      # API settings styling
│   │   └── api-settings.js       # API key management logic
│   └── chat/                     # AI chat assistant module
│       ├── chat.css              # Chat interface styling
│       └── chat.js                # AI chat functionality
├── assets/                       # Static assets
│   ├── favicon.png               # Browser favicon
│   ├── logo.png                  # Main application logo
│   ├── logo-dobby.png            # Header logo
│   └── done.png                  # Success notification icon
└── README.md                     # Project documentation
```

### Core Components

#### 1. ExpenseManager Class (`src/main.js`)
The main application controller that handles:
- Data management and localStorage operations
- Event listener initialization
- Expense filtering and rendering
- Form validation and submission
- Custom date range filtering
- Calendar view rendering (month and week modes)
- UTC timezone handling for accurate date operations
- View switching between list and calendar modes

#### 2. ApiSettingsManager Class (`src/api-settings/api-settings.js`)
Manages Fireworks AI API configuration:
- API key storage and validation
- Connection testing
- Secure key management with visibility toggle
- Status indicators and notifications

#### 3. DobbyChat Class (`src/chat/chat.js`)
AI-powered chat assistant featuring:
- Natural language processing for expense logging
- Intent detection and response generation
- Financial advice and analysis
- Chat history management
- Minimizable interface

#### 4. Key Methods
- `saveExpense()`: Validates and stores new expenses
- `getFilteredExpenses()`: Applies time and category filters including custom date ranges
- `renderExpenses()`: Updates the expense list display
- `renderCalendar()`: Renders calendar view (month or week mode)
- `renderMonthCalendar()`: Displays full month calendar grid
- `renderWeekCalendar()`: Displays weekly calendar view
- `switchView()`: Toggles between list and calendar views
- `switchCalendarViewMode()`: Switches between month and week calendar modes
- `updateTotal()`: Calculates and displays total expenses
- `showDoneNotification()`: Displays success feedback
- `parseUTCDate()`: Parses date strings in UTC timezone
- `parseUTCDateTime()`: Parses date and time in UTC timezone
- `detectIntent()`: AI-powered intent recognition
- `handleExpenseLog()`: Natural language expense recording
- `analyzeExpenseData()`: Comprehensive spending analysis

### Data Structure
Expenses are stored as objects with the following structure:
```javascript
{
    id: timestamp,
    date: "YYYY-MM-DD",
    time: "HH:MM",
    amount: number,
    category: string,
    note: string
}
```

## Expense Categories

The application supports 13 predefined categories:
- Food & Beverage
- Transportation
- Rentals
- Bills
- Education
- Insurances
- Pets
- Home Services
- Fitness
- Makeup
- Gifts & Donations
- Investment
- Others

## Filtering System

### Time Filters
- **Today**: Shows expenses from the current day (UTC timezone)
- **This Week**: Shows expenses from Monday of current week (UTC timezone)
- **This Month**: Shows expenses from the first day of current month (UTC timezone)
- **Custom Range**: User-defined date range with start and end date inputs

### Category Filters
- **All Categories**: Shows all expenses regardless of category
- **Specific Category**: Shows only expenses from selected category

**Note**: Filters are only applied in List View. Calendar View displays all expenses regardless of filter settings.

## Calendar View

### Overview
The calendar view provides a visual representation of expenses organized by date, making it easy to see spending patterns at a glance.

### View Modes
- **Month View**: Displays a full month calendar grid (6 weeks x 7 days) with expense previews
- **Week View**: Displays a single week (7 days) with larger cells for better visibility

### Features
- **Expense Previews**: Each calendar day shows up to 3 expense items with truncated text
- **Total Amount Display**: Daily expense totals shown in each calendar cell
- **Visual Indicators**: 
  - Highlighted current day
  - Selected day highlighting
  - Background color for days with expenses
- **Date Navigation**: 
  - Back/Next buttons to navigate months or weeks
  - Today button to jump to current date
- **Click to View Details**: Click any day to see full expense list in a popup
- **UTC Timezone Support**: All dates and times are handled in UTC (+0) to ensure accuracy across timezones

### Calendar Navigation
- **Month Mode**: Back/Next buttons navigate by month
- **Week Mode**: Back/Next buttons navigate by week
- **Today Button**: Returns to current month/week depending on active mode
- **View Switcher**: Toggle between Month and Week views using header buttons

### Expense Display
- Each calendar cell shows:
  - Date number
  - Total amount for the day
  - Up to 3 expense previews (amount, time, category)
  - "+X more" indicator if there are additional expenses
- Long text is automatically truncated with ellipsis to maintain layout

## AI Chat Assistant

### Capabilities
- **Expense Logging**: Record expenses through natural language (e.g., "Bought lunch for $5")
- **Expense Queries**: Ask about spending by category or time period
- **Financial Analysis**: Get personalized spending analysis and recommendations
- **Budget Advice**: Receive tailored financial advice and budgeting tips
- **Intent Recognition**: Automatically understands user requests and responds appropriately

### AI Integration
- **Fireworks AI**: Powered by the Dobby Unhinged Llama 3.3 70B model
- **Secure API Management**: Encrypted API key storage and validation
- **Context Awareness**: Maintains conversation context for better responses
- **Error Handling**: Graceful handling of API errors and invalid keys

## User Interface Design

### Color Scheme
- Primary: Gold gradient (#e6b800 to #d97706)
- Background: Light yellow overlay (#f9f5d4) with logo watermark
- Text: Dark gray (#4a5568)
- Accent: Red for delete actions (#e53e3e)
- Success: Green for positive actions (#10b981)

### Layout Features
- **Header**: Logo, API Settings button, and Add Expense button
- **View Switcher**: Toggle between List View and Calendar View
- **Filter Section**: Time and category filters with custom date range support (visible in List View only)
- **Summary Card**: Total expense display with animation effects (visible in List View only)
- **Expense List**: Grid-based expense history with hover effects (List View)
- **Calendar Grid**: Month or week calendar with expense previews (Calendar View)
- **Popup Modal**: Expense entry form with background logo
- **Date Expense Popup**: Detailed expense list for selected calendar day
- **Chat Interface**: Minimizable AI assistant with typing indicators

### Responsive Design
- Mobile-first approach with adaptive layouts
- Flexible grid systems that stack on smaller screens
- Touch-friendly button sizes and interactions
- Optimized chat interface for mobile devices

## Browser Compatibility

- Modern browsers with ES6 support
- Local Storage API support
- CSS Grid and Flexbox support
- Fetch API support for AI integration
- Mobile browsers (iOS Safari, Chrome Mobile)

## Installation and Usage

### Setup
1. Clone or download the project files
2. Open `index.html` in a web browser
3. Configure your Fireworks AI API key in the API Settings page
4. No additional dependencies or build process required

### Usage
1. **Manual Expense Entry**: Click "Add Expense" to open the expense entry form
2. **AI-Powered Entry**: Use the chat assistant to record expenses naturally
3. **View Switching**: Toggle between List View and Calendar View using the view switcher buttons
4. **Calendar Navigation**: 
   - Use Back/Next buttons to navigate months or weeks
   - Click Today to return to current date
   - Switch between Month and Week views using calendar header buttons
5. **Viewing Expenses**: 
   - In List View: Use filters to view specific expenses
   - In Calendar View: Click any day to see full expense details in popup
6. **Filtering**: Use time and category filters in List View to view specific expenses
7. **Financial Analysis**: Ask the AI assistant for spending insights and advice
8. **Data Management**: Delete expenses or clear chat history as needed

### API Configuration
1. Visit [fireworks.ai](https://fireworks.ai) to obtain an API key
2. Click "API Settings" in the main interface
3. Enter your Fireworks API key
4. Test the connection to verify the key works
5. Save the configuration for AI features

## Data Storage

The application uses browser localStorage for data persistence:
- **Expense Data**: Stored in JSON format with automatic loading
- **API Keys**: Securely stored for AI functionality
- **Chat History**: Maintains conversation context across sessions
- **Settings**: Preserves user preferences and configurations

## Security Features

- **API Key Protection**: Secure storage and validation of API credentials
- **Input Validation**: Comprehensive form validation and error handling
- **Error Management**: Graceful handling of API failures and network issues
- **Data Privacy**: All data stored locally, no external data transmission

## Future Enhancements

Potential improvements could include:
- **Data Export**: CSV and PDF export functionality
- **Advanced Analytics**: Interactive charts and spending visualizations
- **Multi-Currency Support**: Support for different currencies and exchange rates
- **Data Backup**: Cloud backup and restore functionality
- **Offline Mode**: Service worker implementation for offline functionality
- **User Authentication**: Multi-user support with cloud synchronization
- **Budget Tracking**: Goal setting and budget monitoring features
- **Receipt Management**: Image upload and OCR for receipt processing
