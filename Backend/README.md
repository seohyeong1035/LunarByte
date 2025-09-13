# Backend Guide 

This document explains how to set up and run the backend server.  
Follow the steps carefully to ensure everything works correctly.

```bash
# Create a virtual environment
python -m venv venv

# Activate the environment
venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
