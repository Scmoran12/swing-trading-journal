@echo off
setlocal
cd /d "%~dp0\..\.."
call npm.cmd run start
if errorlevel 1 pause
