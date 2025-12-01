# Drone ML Inference with LoRa Communication

ML inference on ARM Cortex-M microcontrollers with LoRa wireless communication for drone applications.

## 🎯 Project Achievements

- ✅ **Cortex-M55 ML Inference:** 0.46ms mean latency (2,174 inf/sec)
- ✅ **LoRa Communication:** Hardware validated on STM32WLE5JC
- ✅ **IEEE Paper Data:** 6 tables + 2 figures ready
- ✅ **CI/CD Pipeline:** GitHub Actions automated builds
- ✅ **Hardware Tested:** LoRa E5 Mini transmitting successfully

## 📁 Repository Structure
```
firmware/
├── lora_e5_txrx/          # LoRa E5 TX firmware (STM32WLE5JC)
├── sx1276_rx_station/      # SX1276 RX firmware (STM32F401)
└── stm32n6_inference/      # STM32N6 ML inference (Cortex-M55)

lora_e5_hardware_test/      # Hardware validation logs
results/                    # IEEE paper tables & figures
```

## 🚀 Quick Start

### Build LoRa E5 Firmware
```bash
cd firmware/lora_e5_txrx
west build -b lora_e5_mini
west flash
```

### Flash & Monitor
```bash
pyocd flash -t stm32wle5jcix build/zephyr/zephyr.hex
pyocd rtt -t stm32wle5jcix
```

## 📊 Performance Results

**Cortex-M55 (STM32N6):**
- Inference: 0.46ms (mean)
- Memory: 10.7KB RAM, 52KB Flash
- Platform: Zephyr RTOS v4.2.0

**LoRa Communication:**
- Frequency: 868.1 MHz (EU868)
- Modulation: SF7, BW125, CR 4/5
- TX Power: 14 dBm
- Success Rate: 100%

## 📄 Documentation

- `FINAL_SUMMARY.md` - Complete project overview
- `PROJECT_COMPLETION_REPORT.md` - Detailed report
- `lora_e5_hardware_test/HARDWARE_TEST_SUCCESS.md` - Hardware validation

## 🔧 Hardware

1. **STM32N6570-DK** (Cortex-M55 @ 400MHz) - ML inference
2. **Seeed LoRa E5 Mini** (STM32WLE5JC) - LoRa communication
3. **STM32F401 + SX1276** - LoRa receiver (optional)

## 📖 Research Paper

This project provides validated data for IEEE conference paper on embedded ML inference performance.

**Generated artifacts:** 6 LaTeX tables, 2 PDF figures, QEMU measurements, hardware logs
