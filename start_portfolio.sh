#!/bin/bash

# Start Flask API backend
cd backend
echo "Starting Flask API backend..."
python3 app.py &
FLASK_PID=$!
echo "Flask backend started with PID: $FLASK_PID"

# Wait for Flask to start
sleep 2

# Change to React frontend directory
cd ../react-frontend

# Start React development server
echo "Starting React frontend..."
npm start

# When React server is closed, kill Flask backend
kill $FLASK_PID
echo "Flask backend stopped."
