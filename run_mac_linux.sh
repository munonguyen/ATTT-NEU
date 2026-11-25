#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
  echo "[1/3] Khoi tao moi truong ao Python (.venv)..."
  python3 -m venv .venv
fi

echo "[2/3] Cai dat thu vien phu thuoc (PySide6, pytest)..."
.venv/bin/python -m pip install -r python_mhk/requirements.txt

echo "[3/3] Khoi chay chuong trinh MHK..."
.venv/bin/python run.py

