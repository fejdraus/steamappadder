## ✨ New Features

- Added remove button on Steam store pages
- Dynamic switching between "Add to library" (blue) and "Remove from library" (red)
- Automatic button refresh without page reload
- Confirmation dialog before removing game

## 🔧 Technical Changes

- Added `deletegame` and `checkPirated` functions
- Improved UX with process indication ("Adding...", "Removing...")
- Red gradient styling for remove button
- Updated repository URLs to forked version

## 📦 Installation

### Easy Installation (Recommended)

1. Download **`InstallerFull.exe`** from Assets below
2. Run as administrator (right-click → Run as administrator)
3. The installer will automatically:
   - Install SteamBrew (Millennium)
   - Download and install SteamTools
   - Download and install the plugin
   - Configure Millennium
   - Import registry settings
   - Set up startup shortcut

### Manual Installation

If you prefer manual installation:

1. Download and extract `steamtools.zip` to `C:\Program Files\SteamTools\`
2. Download and extract `release.zip` to `C:\Program Files (x86)\Steam\plugins\`
3. Download and place configuration files:
   - `millennium.ini` and `config.json` → `C:\Program Files (x86)\Steam\ext\`
   - `a.reg` → import to registry (optional)
4. Restart Steam

## ⚠️ Requirements

- Windows OS
- Python 3.x (for automatic installation)
- Steam installed
- Administrator rights

## 🎮 Usage

1. Open Steam Store page for any game
2. If game is not added - click blue **"Add to library"** button
3. If game is already added - click red **"Remove from library"** button
4. Restart Steam when prompted (or later)
