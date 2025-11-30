# Quick Reference

## Build
```bash
cd firmware/stm32n6
west build -b qemu_cortex_m7
west build -t run
```

## Flash
```bash
./tools/flash.sh stm32n6
```

## Monitor
```bash
./tools/monitor.sh /dev/ttyUSB0
```

## Analyze LoRa
```bash
./tools/parse_lora_logs.py < uart.log
```

## Hardware Specs

- [MCU Comparison](hardware/specs/mcu_comparison.md)
- [LoRa Modules](hardware/specs/lora_modules.md)
