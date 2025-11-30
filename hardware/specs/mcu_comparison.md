# MCU Comparison

## STM32 Family

| MCU | Core | Freq (MHz) | SRAM (KB) | Flash (KB) | NPU | H.264 | L1 Cache |
|-----|------|------------|-----------|------------|-----|-------|----------|
| STM32F4 | Cortex-M4 | 180 | 256 | 2048 | No | No | 16KB I + 16KB D |
| STM32U5 | Cortex-M33 | 160 | 2560 | 4096 | No | No | 16KB I + 16KB D |
| STM32H7 | Cortex-M7 | 550 | 1024 | 2048 | No | Yes | 16KB I + 16KB D |
| STM32N6 | Cortex-M55 | 600 | 2560 | 2048 | Yes | Yes | 32KB I + 32KB D |

## Other Platforms

| MCU | Core | Freq (MHz) | SRAM (KB) | Flash (KB) | Notes |
|-----|------|------------|-----------|------------|-------|
| ESP32-S3 | Xtensa LX7 | 240 | 512 | 384 | Dual-core with WiFi/BLE |
