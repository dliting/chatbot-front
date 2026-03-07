@echo off
rem Wrapper script to stop ChatApp from project root
rem Usage: stop-chatapp.bat

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
call "%SCRIPT_DIR%\scripts\stop-chatapp.bat"
