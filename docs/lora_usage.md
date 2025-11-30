# LoRa Usage Guide

## Flashing LoRa E5
```bash
cd firmware/lora_e5
west build -b lora_e5_mini
west flash
```

## Capturing Measurements
```bash
screen /dev/ttyUSB0 115200 | tee lora.log
```

## Processing Results
```bash
./tools/parse_lora_logs.py < lora.log > measurements.json
```

## Airtime Calculations

See `hardware/specs/lora_modules.md` for reference values.

Use the calculator:
```bash
./tools/calculate_lora_airtime.py --payload 1000 --sf 7 --bw 125
```
