@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ===============================================
echo    BlockPop - full APK build (Expo SDK 53)
echo ===============================================
echo.

echo [1/5] Clean install of dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json
call npm install
if errorlevel 1 goto :err
echo.

echo [2/5] Generating native Android project...
call npx expo prebuild --platform android --clean
if errorlevel 1 goto :err
echo.

echo [3/5] Disabling new architecture (no NDK needed this way)...
powershell -NoProfile -Command "$p='android\gradle.properties'; $c = Get-Content $p; if ($c -match 'newArchEnabled') { $c = $c -replace 'newArchEnabled=.*','newArchEnabled=false' } else { $c += 'newArchEnabled=false' }; Set-Content $p $c"
if errorlevel 1 goto :err
echo     new architecture OFF - build will use prebuilt native libraries.
echo.

echo [4/5] Building signed release APK (bundles JS, takes several minutes)...
cd android
set "KS=%cd%\app\debug.keystore"
call gradlew.bat assembleRelease ^
  -Pandroid.injected.signing.store.file="%KS%" ^
  -Pandroid.injected.signing.store.password=android ^
  -Pandroid.injected.signing.key.alias=androiddebugkey ^
  -Pandroid.injected.signing.key.password=android
if errorlevel 1 ( cd .. & goto :err )
cd ..
echo.

echo [5/5] Copying APK...
copy /y "android\app\build\outputs\apk\release\app-release.apk" "BlockPop.apk" >nul
if errorlevel 1 goto :err

echo.
echo ===============================================
echo   DONE!  Installable APK ready:
echo   %cd%\BlockPop.apk
echo   Copy it to your phone and install
echo   (allow "Install from unknown sources").
echo ===============================================
echo.
pause
exit /b 0

:err
echo.
echo *************************************************
echo   Failed at the step above. Copy the error text
echo   and send it to Claude - it will fix it.
echo *************************************************
echo.
pause
exit /b 1
