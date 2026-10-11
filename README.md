## CalcoHub – MERN Stack Calculator
CalcoHub is a full-stack calculator application built using the MERN stack. It provides a clean, user-friendly 
interface for performing calculations and stores calculation history in MongoDB Atlas. This project helped me 
explore full-stack development, API integration, and database management.

## Tech Stack
- **Frontend**: React.js, HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Tools:** VSCode, Git, GitHub,and npm

## Features
- Perform basic arithmetic operations (+, −, ×, ÷).
- Supports multiple operations in a single expression with operator precedence.
- Simple, attractive, and responsive user interface.
- Use the keyboard to enter calculations.
- Automatically save calculation history to MongoDB Atlas.
- View previous calculations and clear history.
- Handles invalid expressions and division by zero.

## How to Clone and Run

# 1. Clone the Repository
  git clone https://github.com/Krishna-Aggala/CalcoHub.git
  
  cd CalcoHub
  
# 2. Start the Backend
  - Navigate to the backend directory and install dependencies 
    cd backend 
    npm install
    
- Create a .env file in the backend folder and add your MongoDB connection string:
  PORT=5000
  MONGO_URI=your_mongodb_connection_string_here
  
- Start the backend server :
  npm start

# Start the Frontend
- Open a new terminal
  cd frontend
  npm install
  
- Create a .env file in the frontend folder:
- .env
  VITE_API_URL=http://localhost:5000/api/calculations
  
- Start the frontend
  npm run dev
  
Open the local URL displayed in your terminal to use CalcoHub.
