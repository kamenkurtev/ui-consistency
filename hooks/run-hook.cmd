: << 'CMDBLOCK'
@echo off
REM Cross-platform wrapper: cmd.exe runs the batch half, a shell runs the rest.
REM `:` is a no-op in every POSIX shell, so this one file works on both.
node "%~dp0..\bin\uic.mjs" %1 %2 %3 %4 %5
exit /b %ERRORLEVEL%
CMDBLOCK

exec node "$(cd "$(dirname "$0")/.." && pwd)/bin/uic.mjs" "$@"
