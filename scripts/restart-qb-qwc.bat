@echo off
REM ============================================
REM  Auto-restart QuickBooks + QWC for TN
REM  Schedule this in Windows Task Scheduler
REM  to run daily (e.g., 6:00 AM)
REM ============================================

echo [%date% %time%] Starting QB/QWC restart... >> "%~dp0restart-log.txt"

REM Kill existing processes
echo Closing QuickBooks and QWC...
taskkill /IM "QBW32.exe" /F >nul 2>&1
taskkill /IM "QBW64.exe" /F >nul 2>&1
taskkill /IM "QBWebConnector.exe" /F >nul 2>&1

REM Wait for processes to fully close
timeout /t 10 /nobreak >nul

REM Start QuickBooks with the company file
REM UPDATE THIS PATH to match TN's QB installation and company file
echo Starting QuickBooks...
start "" "C:\Program Files (x86)\Intuit\QuickBooks Enterprise Solutions 24.0\QBW32.exe" "Q:\Quickbooks\marine east inc.QBW"

REM Wait for QB to fully load
timeout /t 30 /nobreak >nul

REM Start QWC
echo Starting QuickBooks Web Connector...
start "" "C:\Program Files (x86)\Common Files\Intuit\QuickBooks\QBWebConnector\QBWebConnector.exe"

REM Wait for QWC to load
timeout /t 10 /nobreak >nul

echo [%date% %time%] Restart complete. >> "%~dp0restart-log.txt"
