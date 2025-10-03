"""
Build script for creating InstallerFull.exe from install.py
Uses PyInstaller to compile Python script to standalone executable
"""

import subprocess
import sys
import os

def install_pyinstaller():
    """Install PyInstaller if not already installed"""
    print("Installing PyInstaller...")
    subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)

def build_installer():
    """Build the installer executable"""
    print("Building InstallerFull.exe...")

    # PyInstaller command
    cmd = [
        "pyinstaller",
        "--onefile",                    # Single executable file
        "--icon=NONE",                  # No icon (can add custom icon later)
        "--name=InstallerFull",         # Output name
        "--add-data", "install.py;.",   # Include install.py
        "--hidden-import=pyuac",        # Hidden imports
        "--hidden-import=requests",
        "--hidden-import=zipfile",
        "--hidden-import=win32security",
        "--hidden-import=win32api",
        "--hidden-import=win32con",
        "install.py"
    ]

    subprocess.run(cmd, check=True)
    print("\n✅ Build complete! InstallerFull.exe is in dist/ folder")

def main():
    if not os.path.exists("install.py"):
        print("❌ Error: install.py not found in current directory")
        return 1

    try:
        # Check if PyInstaller is installed
        try:
            import PyInstaller
        except ImportError:
            install_pyinstaller()

        build_installer()
        return 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
