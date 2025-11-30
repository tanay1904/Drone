#!/bin/bash
set -e

echo "🚀 Setting up Zephyr development environment..."

# Install Python dependencies for analysis
echo "📦 Installing Python dependencies..."
pip install --user -r analysis/requirements.txt

# Initialize West workspace
echo "🔧 Initializing Zephyr workspace..."
west init -l firmware/zephyr-apps/stm32n6_app || echo "West already initialized"

# Update Zephyr modules (this might take a while)
echo "⬇️  Updating Zephyr modules (this may take 5-10 minutes)..."
west update || echo "West update skipped"

# Export Zephyr CMake package
echo "📤 Exporting Zephyr..."
west zephyr-export || echo "Zephyr export skipped"

# Make scripts executable
echo "🔐 Setting script permissions..."
chmod +x qemu/qemu-launch.sh
chmod +x analysis/analyze.py

echo "✅ Setup complete!"
echo ""
echo "📝 Quick start commands:"
echo "  1. Build STM32N6 app:  cd firmware/zephyr-apps/stm32n6_app && west build -b qemu_cortex_m3"
echo "  2. Run in QEMU:        west build -t run"
echo "  3. Run analysis:       cd analysis && ./analyze.py"
echo "  4. Open notebook:      cd analysis && jupyter notebook templates/plots.ipynb"
