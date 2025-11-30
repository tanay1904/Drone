# GitHub Codespaces Guide

This project is fully configured for **GitHub Codespaces** - a cloud-based development environment that requires zero local setup!

## 🚀 Getting Started

### Option 1: Click the Badge (Easiest)
Click the badge in the README:
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/yourusername/experiment?quickstart=1)

### Option 2: From GitHub Repository
1. Go to your repository on GitHub
2. Click the green **"Code"** button
3. Select **"Codespaces"** tab
4. Click **"Create codespace on main"**

### Option 3: From GitHub Menu
1. Go to https://github.com/codespaces
2. Click **"New codespace"**
3. Select your repository
4. Click **"Create codespace"**

## ⏱️ First-Time Setup

When you create a new codespace:
1. **Wait 5-10 minutes** for the container to build
2. The setup script will automatically:
   - Install Python dependencies
   - Initialize Zephyr workspace
   - Download Zephyr modules (~500MB)
   - Configure the development environment
3. You'll see progress in the terminal

## 🎯 Quick Actions

Once your codespace is ready, try these commands:

### Build and Run Firmware

```bash
# Build STM32N6 application
cd firmware/zephyr-apps/stm32n6_app
west build -b qemu_cortex_m3

# Run in QEMU
west build -t run
# You'll see console output from the firmware!
# Press Ctrl+A then X to exit QEMU
```

### Run Analysis Tools

```bash
# Run Python analysis script
cd analysis
./analyze.py --data-file data/experiment_data.json

# Check the output
cat output/report.md
cat output/results.json
```

### Use Jupyter Notebook

```bash
# Start Jupyter notebook
cd analysis
jupyter notebook --ip=0.0.0.0 --port=8888 templates/plots.ipynb

# VS Code will show a popup to open the forwarded port
# Click "Open in Browser" to access Jupyter
```

## 🔧 Using VS Code Tasks

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Run Task":

- **Build STM32N6 App** - Builds the main application
- **Build STM32WL Driver** - Builds the LoRa driver
- **Run STM32N6 in QEMU** - Builds and runs in emulator
- **Run STM32WL in QEMU** - Builds and runs LoRa app
- **Run Analysis Script** - Analyzes experiment data

Or use the keyboard shortcut: `Ctrl+Shift+B` (default build task)

## 🐛 Debugging in QEMU

1. Start QEMU in debug mode:
   ```bash
   cd firmware/zephyr-apps/stm32n6_app
   west build -b qemu_cortex_m3
   west build -t debugserver
   ```

2. In VS Code:
   - Press `F5` or go to Run → Start Debugging
   - Select "Debug STM32N6 in QEMU"
   - Set breakpoints and step through code!

## 📂 File Structure in Codespaces

```
/workspaces/experiment/          # Your workspace root
├── firmware/                    # Firmware applications
│   └── zephyr-apps/
│       ├── stm32n6_app/        # Main app
│       └── stm32wl_driver/     # LoRa driver
├── analysis/                    # Python analysis tools
├── qemu/                        # QEMU scripts
├── .devcontainer/              # Codespaces configuration
└── .vscode/                    # VS Code settings
```

## 💡 Tips & Tricks

### Terminal Management
- **New Terminal**: `Ctrl+Shift+` ` (backtick)
- **Split Terminal**: Click the split icon in terminal
- **Multiple terminals**: Useful for running QEMU + monitoring logs

### Port Forwarding
When Jupyter or other services start:
1. VS Code automatically forwards the port
2. Click the **"Ports"** tab (bottom panel)
3. Click the **🌐 globe icon** to open in browser
4. Or right-click → "Open in Browser"

### Saving Your Work
- Changes are auto-saved in the codespace
- Commit and push to save to GitHub:
  ```bash
  git add .
  git commit -m "Your changes"
  git push
  ```

### Stopping/Resuming
- Codespaces auto-sleep after 30 min of inactivity
- Your work is saved - just reopen to resume
- **Stop manually**: Go to https://github.com/codespaces
- **Delete when done**: Prevents using free hours

## 🔍 What's Pre-Installed

Your codespace includes:
- ✅ **Zephyr RTOS** (v3.5.0)
- ✅ **ARM GCC Toolchain**
- ✅ **QEMU** for ARM emulation
- ✅ **Python 3.11** with pip
- ✅ **West build tool**
- ✅ **Git**
- ✅ **VS Code extensions** for C/C++, Python, Jupyter

## ⚠️ Limitations

### Things That Work
- ✅ Building firmware
- ✅ Running in QEMU
- ✅ Python analysis
- ✅ Jupyter notebooks
- ✅ Debugging with GDB
- ✅ Git operations

### Things That Don't Work
- ❌ Flashing to real hardware (no USB access)
- ❌ Real LoRa communication (no radio hardware)
- ❌ NPU inference (hardware-specific)

**Solution**: For real hardware testing, use a local development environment

## 🆘 Troubleshooting

### Codespace Won't Start
- **Wait**: First build takes 5-10 minutes
- **Check status**: Look at the terminal output
- **Rebuild**: Delete and create new codespace

### Build Fails
```bash
# Try updating West
west update

# Clean build
cd firmware/zephyr-apps/stm32n6_app
rm -rf build
west build -b qemu_cortex_m3
```

### QEMU Doesn't Exit
- Press `Ctrl+A` then `X`
- If stuck, close the terminal and open a new one

### Jupyter Won't Open
```bash
# Check if port 8888 is forwarded
# Go to Ports tab → Forward port 8888

# Restart Jupyter with explicit settings
jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser
```

### Out of Disk Space
```bash
# Clean build directories
find . -name "build" -type d -exec rm -rf {} +

# Clean Python cache
find . -name "__pycache__" -type d -exec rm -rf {} +
```

## 💰 GitHub Codespaces Pricing

- **Free tier**: 120 core-hours/month, 15GB storage
- **Pro**: 180 core-hours/month, 20GB storage
- This project uses a **4-core machine** = ~30 hours/month free

**Tip**: Stop your codespace when not using it!

## 📚 Additional Resources

- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [Zephyr Getting Started](https://docs.zephyrproject.org/latest/develop/getting_started/index.html)
- [VS Code Remote Development](https://code.visualstudio.com/docs/remote/codespaces)

## 🎉 Ready to Go!

You now have a fully-functional embedded development environment in your browser. No downloads, no configuration, just code!

**Happy hacking! 🚀**
