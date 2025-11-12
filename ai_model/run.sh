#!/bin/bash
set -e

pip install --upgrade pip
pip install -r requirements.txt

# Start app
uvicorn main:app --host 0.0.0.0 --port 8000
