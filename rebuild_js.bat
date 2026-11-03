@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
echo ===============================================
echo   BlockPop - FAST rebuild (JS changes only)
echo ===============================================
if not exist android (
  echo [X] android folder not found. Run build_apk.bat first.
  pause & exit /b 1
)
cd android
set "KS=%cd%\app\debug.keystore"
call gradlew.bat assembleRelease ^
  -Pandroid.injected.signing.store.file="%KS%" ^
  -Pandroid.injected.signing.store.password=android ^
  -Pandroid.injected.signing.key.alias=androiddebugkey ^
  -Pandroid.injected.signing.key.password=android
if errorlevel 1 ( cd .. & echo. & echo BUILD FAILED - send the red text to Claude. & pause & exit /b 1 )
cd ..
copy /y "android\app\build\outputs\apk\release\app-release.apk" "BlockPop.apk" >nul
echo.
echo ===============================================
echo   DONE!  Updated APK: %cd%\BlockPop.apk
echo   Reinstall on your phone (updates in place).
echo ===============================================
echo.
pause
