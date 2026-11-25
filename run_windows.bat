@echo off
cd /d "%~dp0"

if not exist ".venv" (
    echo [1/3] Khoi tao moi truong ao Python ^(.venv^)...
    python -m venv .venv
)

echo [2/3] Cai dat thu vien phu thuoc ^(PySide6, pytest^)...
.venv\Scripts\python.exe -m pip install -r python_mhk\requirements.txt

echo [3/3] Khoi chay chuong trinh MHK...
.venv\Scripts\python.exe run.py
pause

