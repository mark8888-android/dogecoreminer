#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "Starting Dogecoin Core Intranet Mining Game on Port 3000..."
echo "=========================================================="

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js v18 or newer."
    exit 1
fi

echo "1. Installing dependencies..."
npm install

echo "2. Building frontend production bundle..."
npm run build

LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
echo "=========================================================="
echo "Game Server Running on:"
echo "  Local:    http://localhost:3000"
echo "  Intranet: http://${LAN_IP}:3000"
echo "=========================================================="
npm start
