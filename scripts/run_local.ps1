# AICTE FDR Management Portal - Local Development Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "AICTE Security Deposit / FDR Portal - Local Development" -ForegroundColor Cyan
Write-Host "Problem Statement ID: 26265" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Backend in separate job/window
Write-Host "`n[1/2] Starting FastAPI Backend (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

# 2. Start Frontend in separate job/window
Write-Host "[2/2] Starting React Vite Frontend (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`n[Ready] Application running!" -ForegroundColor Cyan
Write-Host "Frontend Portal: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "Health Check:    http://127.0.0.1:8000/api/health" -ForegroundColor White
