# LoRa Module Comparison

| Module | MCU Integrated | Range (km) | TX Power (dBm) | Notes |
|--------|----------------|------------|----------------|-------|
| STM32WL | Yes | 15 | 22 | Cortex-M4 + sub-GHz radio |
| LoRa-E5 | Yes | 10 | 27 | STM32WLE5JC module |
| RAK3172 | Yes | 15 | 22 | STM32WLE5CC based |

## LoRa Airtime Reference

For bandwidth 125kHz:

| Payload (B) | SF7 (s) | SF9 (s) | SF12 (s) |
|-------------|---------|---------|----------|
| 100 | 0.174 | 0.554 | 3.449 |
| 500 | 2.274 | 7.130 | 43.278 |
| 1000 | 7.451 | 23.250 | 140.124 |
| 2000 | 29.494 | 91.965 | 553.861 |

*Values include fragmentation overhead*
