# Steam App Adder Release Guide

## Release Files Preparation

All release files are located in the `release-assets/` folder:

```
release-assets/
├── a.reg              (574 B)   - SteamTools registry settings
├── config.json        (611 B)   - Millennium configuration
├── millennium.ini     (180 B)   - Plugin settings
├── release.zip        (~12 KB)  - steamappadder plugin
├── steamtools.zip     (11 MB)   - SteamTools application
└── InstallerFull.exe  (~16 MB)  - Compiled installer (build required)
```

## Release Creation Process

### Step 0: Build InstallerFull.exe

Before creating a release, you need to compile `install.py` into `InstallerFull.exe`:

**Using build script:**
```bash
# Windows
build_installer.bat

# Or manually with PyInstaller
pip install pyinstaller pyuac requests
pyinstaller --onefile --noconsole --name=InstallerFull --hidden-import=pyuac --hidden-import=requests install.py
```

The executable will be created in `dist/InstallerFull.exe`. Copy it to `release-assets/`.

**Why InstallerFull.exe?**
- Users don't need Python installed
- Single-click installation
- Professional appearance
- Admin rights handled automatically

### Step 1: Ensure Code is Compiled

GitHub Actions automatically compiles TypeScript to JavaScript on every push to `main`.

Check: https://github.com/fejdraus/steamappadder/actions

If the workflow passed successfully, `.millennium/Dist/webkit.js` will be updated.

### Step 2: Creating release.zip (automated)

Release.zip is created from the following files:

```
steamappadder/
├── .millennium/
│   └── Dist/
│       ├── index.js       - Compiled frontend
│       └── webkit.js      - Compiled webkit (with your changes!)
├── backend/
│   └── main.py           - Backend code
├── LICENSE
├── plugin.json           - Plugin metadata
└── requirements.txt      - Python dependencies
```

**Commands to create:**

```bash
cd D:/GitHub/steamappadder/release-assets

# 1. Ensure steamappadder folder contains up-to-date files
# 2. Create archive
powershell "Compress-Archive -Path steamappadder -DestinationPath release.zip -Force"
```

### Step 3: Creating GitHub Release

1. Open: https://github.com/fejdraus/steamappadder/releases
2. Click **"Draft a new release"**
3. Fill out the form:

**Tag version:** `v1.0.4` (or next version)

**Release title:** `Release v1.0.4 - Remove Button on Store Pages`

**Description (example):**
```markdown
## ✨ New Features

- Added remove button on Steam store pages
- Dynamic switching between "Add to library" (blue) and "Remove from library" (red)
- Automatic button refresh without page reload
- Confirmation dialog before removing game

## 🔧 Technical Changes

- Added `deletegame` and `checkPirated` functions
- Improved UX with process indication ("Adding...", "Removing...")
- Red gradient styling for remove button

## 📦 Installation

1. Download `steamtools.zip` and extract to `C:\Program Files\SteamTools\`
2. Download `release.zip` and extract to `C:\Program Files (x86)\Steam\plugins\`
3. Download `millennium.ini`, `config.json`, `a.reg` (optional)
4. Restart Steam

---

🤖 Generated with Claude Code
```

### Step 4: Uploading Assets

In the **"Attach binaries"** section, upload ALL files from `release-assets/`:

1. ✅ **InstallerFull.exe** - Compiled installer (MAIN FILE FOR USERS!)
2. ✅ **a.reg** - SteamTools registry settings
3. ✅ **config.json** - Millennium configuration
4. ✅ **millennium.ini** - Plugin settings
5. ✅ **release.zip** - steamappadder plugin
6. ✅ **steamtools.zip** - SteamTools application

**Important:** GitHub will automatically add `Source code (zip)` and `Source code (tar.gz)` - this is normal.

### Step 5: Publishing

1. Check **"Set as the latest release"** (if this is a stable version)
2. If it's a test version - check **"Set as a pre-release"**
3. Click **"Publish release"**

## Pre-Release Checklist

- [ ] GitHub Actions successfully built the project
- [ ] Updated `.millennium/Dist/webkit.js` file
- [ ] Created `release.zip` with current files
- [ ] All 5 files ready for upload
- [ ] Version in `plugin.json` updated (if needed)
- [ ] Release description written
- [ ] Installation tested on clean system

## Automation (Future)

You can create a GitHub Action for automatic release building:

```yaml
name: Create Release
on:
  push:
    tags:
      - 'v*'
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build release.zip
        run: |
          # ... build commands
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            release-assets/release.zip
            release-assets/*.reg
            release-assets/*.json
            release-assets/*.ini
```

## Version Structure

- **Major (1.x.x)** - Major changes, breaking changes
- **Minor (x.1.x)** - New features, backward compatible
- **Patch (x.x.1)** - Bug fixes

**Current version:** 1.0.3
**Next (with your changes):** 1.0.4 or 1.1.0

## Important Notes

1. **release.zip** - this is NOT the entire repository, only the plugin
2. **steamtools.zip** is NOT stored in git (too large)
3. **InstallerFull.exe** is created separately (compiled `install.py`)
4. Files `.reg`, `.ini`, `.json` - small configs, can be stored in git

## Where Things Are Stored

**In repository:**
- Source code (TypeScript)
- Configs (millennium.ini, config.json, a.reg) - CAN be added
- GitHub Actions workflows

**NOT in repository (only in Releases):**
- Compiled .js files (.millennium/Dist/) - created automatically
- steamtools.zip - too large (11 MB)
- InstallerFull.exe - binary

**In release-assets/ (locally for release):**
- All files for uploading to Release
- Temporary folder for release preparation

---

✅ **Done!** You can now create releases independently.
