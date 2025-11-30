# STM32 Embedded Firmware Platform

Professional embedded firmware for STM32-based systems using Zephyr RTOS.

## Supported Hardware

- **STM32N6** - Cortex-M55 with NPU (Neural-ART accelerator)
- **STM32WL** - Cortex-M4 with integrated sub-GHz LoRa radio
- **LoRa-E5 Mini** - STM32WLE5JC module

## Features

- Zephyr RTOS v3.5+
- Real-time control loops with measurements
- LoRa/LoRaWAN communication
- Structured logging for data analysis
- Hardware abstraction layers
- QEMU emulation support

## Quick Start
```bash
# Install dependencies
pip3 install west

# Initialize workspace
west init -l firmware/stm32n6
west update
west zephyr-export

# Build for QEMU
cd firmware/stm32n6
west build -b qemu_cortex_m7

# Run in QEMU
west build -t run

# Build for hardware
west build -b lora_e5_mini
west flash
```

## Repository Structure
```
firmware/          # Zephyr applications
├── stm32n6/      # Main control with NPU
├── stm32wl/      # LoRa driver
└── lora_e5/      # Hardware measurements

hardware/          # Schematics, pinouts, specs
tools/            # Flash, monitor, analysis scripts
docs/             # Documentation
```

## Documentation

- [Setup Guide](docs/setup.md)
- [Firmware Architecture](docs/firmware_architecture.md)
- [Measurements](docs/measurements.md)
- [LoRa Usage](docs/lora_usage.md)

## Development

### Build All Targets
```bash
./scripts/build_all.sh
```

### Flash Hardware
```bash
./tools/flash.sh stm32n6 lora_e5_mini
```

### Monitor Serial
```bash
./tools/monitor.sh /dev/ttyUSB0
```

## CI/CD

Automated builds run on every push:
- All firmware targets
- QEMU validation
- Python tool linting

## Hardware Specifications

See [hardware/specs/](hardware/specs/) for detailed comparisons of:
- MCU capabilities
- LoRa module specifications
- Performance characteristics

## License

See LICENSE file

## Contributing

1. Fork repository
2. Create feature branch
3. Test on hardware
4. Submit pull request
# Trigger rebuild
