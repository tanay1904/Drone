# Experiment Documentation

## Overview

This repository contains firmware, models, and analysis tools for embedded system experiments using Zephyr RTOS on STM32 platforms.

## Repository Structure

```
experiment/
├── firmware/
│   └── zephyr-apps/
│       ├── stm32n6_app/        # STM32N6 control + NPU stub
│       ├── stm32wl_driver/     # LoRa driver + SPI test harness
│       └── reference_apps/     # Reference implementations
├── models/                      # TFLite models for NPU
├── qemu/                       # QEMU emulation scripts
├── ci/                         # CI/CD workflows
├── analysis/                   # Data analysis tools
└── docs/                       # Documentation
```

## Quick Start

### Prerequisites

- Zephyr SDK (version 0.16.5 or later)
- West tool (`pip install west`)
- Python 3.11+
- ARM GCC toolchain
- QEMU (for emulation)

### Setup Zephyr Environment

```bash
# Initialize workspace
west init -m https://github.com/zephyrproject-rtos/zephyr --mr v3.5.0 zephyrproject
cd zephyrproject
west update
west zephyr-export

# Install Python dependencies
pip install -r zephyr/scripts/requirements.txt
```

### Building Applications

#### STM32N6 Application

```bash
cd firmware/zephyr-apps/stm32n6_app
west build -b qemu_cortex_m3
west build -t run  # Run in QEMU
```

#### STM32WL LoRa Driver

```bash
cd firmware/zephyr-apps/stm32wl_driver
west build -b qemu_cortex_m4
west build -t run
```

### Using QEMU

```bash
cd qemu
./qemu-launch.sh -b qemu_cortex_m3 -a ../firmware/zephyr-apps/stm32n6_app
```

For more QEMU options, see [qemu-boards.md](../qemu/qemu-boards.md).

## Applications

### STM32N6 Application

**Purpose**: Control firmware with NPU stub interface for ML inference

**Features**:
- Main control loop
- NPU stub communication (SPI-based)
- GPIO control
- Logging system

**Files**:
- `src/main.c` - Main entry point
- `src/npu_stub.c` - NPU interface stub
- `src/control.c` - Control subsystem

### STM32WL LoRa Driver

**Purpose**: LoRa communication driver with SPI test harness

**Features**:
- SX126x-based LoRa driver
- SPI communication test
- LoRaWAN support (optional)
- RSSI/SNR monitoring

**Files**:
- `src/main.c` - Main entry point
- `src/lora_driver.c` - LoRa implementation
- `src/spi_test.c` - SPI test harness

## Models

TensorFlow Lite models for NPU deployment:
- `yolov5n_int8.tflite` - Object detection (INT8 quantized)
- `mobilenet_v2_int8.tflite` - Image classification (INT8 quantized)

See [models/README.md](../models/README.md) for model details.

## Analysis Tools

### analyze.py

Python script for analyzing experiment data and generating reports.

**Usage**:
```bash
cd analysis
./analyze.py --data-dir data --output-dir output --data-file experiment_data.json
```

**Features**:
- Performance metric analysis
- Statistical calculations
- Report generation (Markdown + JSON)

### Jupyter Notebook

Interactive data visualization using matplotlib.

**Usage**:
```bash
cd analysis
jupyter notebook templates/plots.ipynb
```

**Plots**:
- Latency distribution
- Throughput time series
- Power consumption summary

## CI/CD

GitHub Actions workflow automatically:
- Builds all applications
- Runs QEMU tests
- Lints Python code
- Validates documentation

See [.github/workflows/ci.yml](../ci/.github/workflows/ci.yml) for details.

## Hardware Platforms

### Supported Boards

- **STM32N6**: NPU-enabled platform (QEMU: limited support)
- **STM32WL**: LoRa wireless platform (QEMU: qemu_cortex_m4)
- **STM32U5**: Ultra-low-power reference
- **STM32H7**: High-performance reference

### Limitations

- QEMU cannot emulate STM32N6 NPU
- LoRa radio not available in QEMU
- Some peripherals require real hardware

## Development Workflow

1. **Write Code**: Modify application in `firmware/zephyr-apps/`
2. **Build**: `west build -b <board>`
3. **Test in QEMU**: `west build -t run` or use `qemu-launch.sh`
4. **Analyze**: Run `analyze.py` on collected data
5. **Deploy**: Flash to real hardware for full validation

## Debugging

### GDB with QEMU

```bash
# Terminal 1: Start GDB server
west build -t debugserver

# Terminal 2: Connect GDB
arm-none-eabi-gdb build/zephyr/zephyr.elf
(gdb) target remote :1234
(gdb) break main
(gdb) continue
```

### Logging

Enable detailed logging in `prj.conf`:
```
CONFIG_LOG_DEFAULT_LEVEL=4  # Debug level
CONFIG_LOG_MODE_IMMEDIATE=y # Immediate output
```

## Contributing

1. Create a feature branch
2. Make changes
3. Test in QEMU
4. Submit pull request
5. CI will validate your changes

## Troubleshooting

### Build Errors

**Problem**: `west: command not found`
**Solution**: Install west: `pip install west`

**Problem**: `ZEPHYR_BASE not set`
**Solution**: Run `west zephyr-export` in zephyr workspace

### Runtime Errors

**Problem**: Device not ready
**Solution**: Check devicetree configuration and board support

**Problem**: QEMU hangs
**Solution**: Press Ctrl+A then X to exit QEMU

## References

- [Zephyr Documentation](https://docs.zephyrproject.org/)
- [STM32 Product Pages](https://www.st.com/en/microcontrollers-microprocessors.html)
- [QEMU Documentation](https://www.qemu.org/docs/master/)
- [TensorFlow Lite for Microcontrollers](https://www.tensorflow.org/lite/microcontrollers)

## License

See LICENSE file for details.

## Contact

For questions or issues, please open a GitHub issue.
