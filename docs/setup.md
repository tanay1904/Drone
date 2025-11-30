# Development Setup

## Prerequisites

- Zephyr SDK 0.16.5+
- Python 3.11+
- West tool
- OpenOCD (for hardware flashing)

## Install Zephyr
```bash
pip3 install west
west init -l firmware/stm32n6
west update
west zephyr-export
pip3 install -r ~/zephyrproject/zephyr/scripts/requirements.txt
```

## Build Firmware
```bash
cd firmware/stm32n6
west build -b qemu_cortex_m7
```

## Flash Hardware
```bash
./tools/flash.sh stm32n6 lora_e5_mini
```

## Monitor Serial
```bash
./tools/monitor.sh /dev/ttyUSB0 115200
```
