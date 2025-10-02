@echo off
echo Building InstallerFull.exe...
echo.

REM Install PyInstaller if needed
pip install pyinstaller pyuac requests

REM Build the installer
pyinstaller --onefile --noconsole --name=InstallerFull --hidden-import=pyuac --hidden-import=requests install.py

echo.
echo Build complete! Check dist\InstallerFull.exe
pause
