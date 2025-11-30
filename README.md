# Edge AI Embedded Platform

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/yourusername/experiment?quickstart=1)

STM32-based embedded system with Zephyr RTOS, LoRa telemetry, and automated paper results generation.

## Quick Start

```bash
# Generate IEEE paper results
cd analysis && ./generate_paper_results.py

# Build firmware
cd firmware/zephyr-apps/stm32n6_app
west build -b qemu_cortex_m3

# Run in QEMU
west build -t run
```

## Features

- Zephyr RTOS firmware (STM32N6, STM32WL, LoRa E5)
- QEMU emulation support
- LoRa/LoRaWAN drivers
- Automated measurement extraction
- IEEE paper LaTeX generation
- CI/CD pipeline

## Structure

```
experiment/
├── firmware/           # Zephyr applications
│   └── zephyr-apps/
│       ├── stm32n6_app/
│       ├── stm32wl_driver/
│       └── lora_e5_measurements/
├── analysis/           # Paper results generation
│   ├── generate_paper_results.py
│   ├── parse_qemu_logs.py
│   └── ...
├── qemu/              # Emulation scripts
└── ci/                # GitHub Actions

```

## Documentation

- `README_QUICK.md` - Quick reference
- `analysis/README_PAPER_RESULTS.md` - Detailed guide
- `docs/experiment.md` - Complete documentation

## Hardware Support

- **QEMU**: qemu_cortex_m3, qemu_cortex_m4
- **Real Hardware**: LoRa E5 Mini, STM32WL, STM32N6 (when available)

## License

See LICENSE file
