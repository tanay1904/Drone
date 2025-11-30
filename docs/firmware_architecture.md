# Firmware Architecture

## STM32N6 Application

- **Purpose**: Main control loop with NPU integration
- **Features**:
  - Control loop with timing measurements
  - NPU stub for ML inference
  - Event extraction
  - Data compression
  - SPI communication prep

## STM32WL Driver

- **Purpose**: LoRa/LoRaWAN communication
- **Features**:
  - LoRa driver abstraction
  - SPI interface
  - Test harness

## LoRa E5

- **Purpose**: Hardware measurements
- **Features**:
  - Real LoRa airtime measurement
  - RSSI/SNR logging
  - Multiple payload/SF testing

## Common Patterns

All firmware uses:
- Zephyr RTOS
- Structured logging (CSV-like format)
- Measurement boundaries markers
- Cycle counter integration
