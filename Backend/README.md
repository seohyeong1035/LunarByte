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


### 3. Download Model Weights

This project uses the [Deepfake Detection Challenge model](https://github.com/selimsef/dfdc_deepfake_challenge).

Due to size limitations, pretrained weights are **not included** here.  
Please download them manually:

- Clone or download from:  https://github.com/selimsef/dfdc_deepfake_challenge
- Create a `weights/` folder inside `Backend/`
- Place the `.pth` weight files in this folder
