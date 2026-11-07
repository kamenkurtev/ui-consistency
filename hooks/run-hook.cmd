: << 'CMDBLOCK'
@echo off
REM Runs a hook script under bash on every platform. cmd.exe runs this batch
REM half, which finds bash; a POSIX shell skips it (`:` is a no-op) and runs the
REM rest. Modelled on superpowers' hooks/run-hook.cmd (MIT, Jesse Vincent).
REM
REM Usage: run-hook.cmd <script-name> [args...]

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

setlocal
set "HOOK_DIR=%~dp0"
set "BASH_EXE="

if exist "C:\Program Files\Git\bin\bash.exe" set "BASH_EXE=C:\Program Files\Git\bin\bash.exe"
if not defined BASH_EXE if exist "C:\Program Files (x86)\Git\bin\bash.exe" set "BASH_EXE=C:\Program Files (x86)\Git\bin\bash.exe"
REM A per-user Git install. With LOCALAPPDATA unset the path would fall to the
REM current drive, where anybody can create it.
if not defined BASH_EXE if defined LOCALAPPDATA if exist "%LOCALAPPDATA%\Programs\Git\bin\bash.exe" set "BASH_EXE=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"

REM bash on PATH. cmd.exe looks in the current directory, the user's project,
REM first: where.exe by its full path, with $PATH:, finds neither itself nor bash
REM there. Extensionless matches and the WSL launchers, which fail with no Linux
REM installed, are skipped.
if not defined BASH_EXE if defined SystemRoot for /f "delims=" %%B in ('"%SystemRoot%\System32\where.exe" $PATH:bash 2^>nul') do if not defined BASH_EXE if not "%%~xB"=="" if /i not "%%~dpB"=="%SystemRoot%\System32\" if /i not "%%~dpB"=="%SystemRoot%\Sysnative\" if /i not "%%~dpB"=="%LOCALAPPDATA%\Microsoft\WindowsApps\" set "BASH_EXE=%%B"

REM No bash: say nothing. The skills still load; only the session text is missing.
if not defined BASH_EXE exit /b 0

REM Outside a parenthesised block, where cmd would expand %ERRORLEVEL% too early.
"%BASH_EXE%" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
exit /b %ERRORLEVEL%
CMDBLOCK

HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${HOOK_DIR}/${SCRIPT_NAME}" "$@"
