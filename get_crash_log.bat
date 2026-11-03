@echo off
setlocal
cd /d "%~dp0"
set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist "%ADB%" set "ADB=adb"
echo ===============================================
echo   BlockPop - capture crash log from phone
echo ===============================================
echo Using adb: %ADB%
echo.
echo Connected devices:
"%ADB%" devices
echo.
echo If your phone is NOT listed above:
echo   1) connect it with a USB cable
echo   2) enable Developer Options + USB debugging on the phone
echo   3) tap "Allow USB debugging" on the phone when asked
echo Then press any key.
pause
"%ADB%" logcat -c
echo.
echo  ^>^>^>  NOW OPEN THE BlockPop APP ON YOUR PHONE AND LET IT CRASH  ^<^<^<
echo.
echo After it closes, come back here and press any key.
pause
"%ADB%" logcat -d -v threadtime > crash_log_full.txt 2>&1
"%ADB%" logcat -d -v threadtime AndroidRuntime:E ReactNativeJS:E ReactNative:E ExpoModulesCore:E libc:F DEBUG:F *:S > crash_log.txt 2>&1
echo.
echo Saved: crash_log.txt  and  crash_log_full.txt
echo Send crash_log.txt to Claude.
pause
