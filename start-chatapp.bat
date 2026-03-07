@echo off
rem Wrapper script to start ChatApp from project root
rem Usage: start-chatapp.bat [real|mock]

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
call "%SCRIPT_DIR%\scripts\start-chatapp.bat" %*
