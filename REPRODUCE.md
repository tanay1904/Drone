# Reproducibility / Quick experimental run

This file explains how to run the full pre-silicon experiment locally (build, QEMU, parse, plot).

## Prereqs
- west, Zephyr SDK configured
- qemu-system-arm installed
- python3 + pip
- run: `pip3 install -r requirements.txt`

## Quick local run
1. From repo root:
```bash
# make the runner executable if needed
chmod +x tools/qemu/run_qemu.sh
chmod +x scripts/run_experiments.sh

# run everything (build + qemu + parse + plots)
scripts/run_experiments.sh
