@echo off
echo Building InstallerLite.exe...
echo.

REM Install PyInstaller if needed
pip install pyinstaller pyuac requests pywin32

REM Build the lite installer using Python module
python -m PyInstaller --onefile --name=InstallerLite --hidden-import=pyuac --hidden-import=requests --hidden-import=win32security --hidden-import=win32api --hidden-import=win32con install_lite.py

echo.
echo Build complete! Check dist\InstallerLite.exe
pause
