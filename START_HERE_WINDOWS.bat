@echo off
cd /d "%~dp0"
echo CINEGENOME LAB
where py >nul 2>nul && (start http://localhost:8080 & py -m http.server 8080 & goto :eof)
where python >nul 2>nul && (start http://localhost:8080 & python -m http.server 8080 & goto :eof)
echo Python was not found. Opening the offline build directly...
start index.html
