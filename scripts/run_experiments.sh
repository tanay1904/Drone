#!/usr/bin/env bash
# scripts/run_experiments.sh
# Builds all firmwares, runs them in QEMU (if possible), collects logs, runs parser and plotting.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT"

# Results layout
RESULTS_DIR="$ROOT/results"
RAW_DIR="$RESULTS_DIR/raw"
PARSED_DIR="$RESULTS_DIR/parsed"
PLOTS_DIR="$RESULTS_DIR/plots"
mkdir -p "$RAW_DIR" "$PARSED_DIR" "$PLOTS_DIR"

# Configurable list of firmwares & boards (tweak as needed)
declare -A FW_BOARD=(
  ["stm32n6"]="mps3_an547"
  ["stm32wl"]="mps2_an521"
  ["lora_e5"]="mps2_an521"
)

# Ensure west workspace exists
if [ ! -f west.yml ]; then
  echo "Missing top-level west.yml. Add one to root of repo."
  exit 1
fi

# Initialize and update (shallow update for speed)
if [ ! -d workspace ]; then
  mkdir -p workspace
  (cd workspace && west init -l ..)
fi

# Build & run each firmware
for fw in "${!FW_BOARD[@]}"; do
  board="${FW_BOARD[$fw]}"
  echo "=== BUILD: $fw (board=$board) ==="
  pushd "firmware/$fw" >/dev/null
  # west build: produce build in firmware/<fw>/build
  west build -b "$board" -p auto || { echo "Build failed for $fw"; popd; exit 1; }
  # collect artifacts
  BUILD_DIR="$(pwd)/build/zephyr"
  if [ -f "$BUILD_DIR/zephyr.elf" ]; then
    cp "$BUILD_DIR/zephyr.elf" "$RAW_DIR/${fw}-${board}.elf"
  fi
  if [ -f "$BUILD_DIR/zephyr.hex" ]; then
    cp "$BUILD_DIR/zephyr.hex" "$RAW_DIR/${fw}-${board}.hex"
  fi
  if [ -f "$BUILD_DIR/zephyr.bin" ]; then
    cp "$BUILD_DIR/zephyr.bin" "$RAW_DIR/${fw}-${board}.bin"
  fi

  # Run QEMU if a runner exists
  QEMU_RUNNER="$ROOT/tools/qemu/run_qemu.sh"
  if [ -x "$QEMU_RUNNER" ]; then
    echo "--- Running QEMU for $fw ---"
    LOG_OUT="$RAW_DIR/${fw}-${board}.uart.log"
    # run_qemu.sh should accept: elf path and output log path (we try that contract)
    "$QEMU_RUNNER" "$BUILD_DIR/zephyr.elf" "$LOG_OUT" || echo "QEMU run returned non-zero for $fw"
  else
    echo "No runnable QEMU runner at tools/qemu/run_qemu.sh (skipped QEMU for $fw)."
  fi

  popd >/dev/null
done

echo "=== PARSING LOGS ==="
# Use your existing parser if available
if [ -x tools/parse_lora_logs.py ] || [ -f tools/parse_lora_logs.py ]; then
  for f in "$RAW_DIR"/*.uart.log; do
    [ -e "$f" ] || continue
    base="$(basename "$f" .uart.log)"
    echo "Parsing $base"
    python3 tools/parse_lora_logs.py --input "$f" --output "$PARSED_DIR/$base.csv" || echo "Parser failed for $base"
  done
else
  echo "tools/parse_lora_logs.py not found or not executable; skipping parsing."
fi

echo "=== PLOTTING ==="
# Run generic plotter (if Python deps are installed)
if python3 -c "import sys,pandas" >/dev/null 2>&1; then
  python3 tools/plot_results.py --input "$PARSED_DIR" --outdir "$PLOTS_DIR" || echo "Plotting failed"
else
  echo "Python plotting dependencies missing; run: pip install -r requirements.txt"
fi

echo "Done. Results in: $RESULTS_DIR"
