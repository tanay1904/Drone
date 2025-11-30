# IEEE Paper Placeholder Coverage - Test Specification

This document maps every placeholder in the IEEE paper to specific tests and measurements.

## Section IV: System Architecture
### Placeholders Required:
- Board names for QEMU builds
- App paths for build commands
- QEMU machine specifications

## Section IX: Results - All Tables and Figures

### Table 1: CPU-only software latency baseline (tab:qemu_baseline)
**Placeholders to fill:**
- Inference (CPU-only): Mean, Std, p90, p99 (ns)
- Event extraction: Mean, Std, p90, p99 (ns)
- Compression (SW fallback): Mean, Std, p90, p99 (ns)
- SPI packet prep: Mean, Std, p90, p99 (ns)
- Control loop handler: Mean, Std, p90, p99 (ns)

**Test:** `test_baseline_qemu.py`
**Measurement:** QEMU runs with structured logging, parse MEAS lines

### Table 2: Modeled NPU latencies (tab:npu_modeled)
**Placeholders to fill:**
- p50 baseline → Modeled NPU (Low), Modeled NPU (High), Notes
- p90 baseline → Modeled NPU (Low), Modeled NPU (High), Notes
- p99 baseline → Modeled NPU (Low), Modeled NPU (High), Notes

**Test:** `test_npu_model.py`
**Model:** Apply speedup factors [8, 20] to QEMU baselines

### Table 3: LoRa airtime per payload (tab:lora_airtime)
**Placeholders to fill:**
- Payload sizes: [100B, 500B, 1000B, 2000B]
- SF/BW: [SF7/125kHz, SF9/125kHz, SF12/125kHz]
- Airtime (s): computed
- Fragments: computed

**Test:** `test_lora_airtime.py`
**Model:** Semtech airtime formula from Appendix D

### Figure 1: Control loop jitter CDF (fig:control_jitter)
**Placeholders to fill:**
- CDF plot of control loop jitter under mixed load
- X-axis: Latency (μs)
- Y-axis: CDF (0-1)

**Test:** `test_control_jitter.py`
**Measurement:** QEMU CTRL log lines, extract jitter distribution

### Table 4: MCU family comparison (tab:mcu_family)
**Placeholders to fill:**
| MCU | Core | Max Freq | SRAM | Flash | NPU | HW H.264 |
|-----|------|----------|------|-------|-----|----------|
| STM32F4 | Cortex-M4 | 180 | 256 | 2048 | No | No |
| STM32U5 | Cortex-M33 | 160 | 2560 | 4096 | No | No |
| STM32H7 | Cortex-M7 | 550 | 1024 | 2048 | No | Yes |
| STM32N6 | Cortex-M55 | 600 | 2560 | 2048 | Yes | Yes |
| ESP32-S3 | Xtensa LX7 | 240 | 512 | 384 | No | No |

**Source:** Vendor datasheets (static data)

### Table 5: SBC comparison (tab:sbc_comp)
**Placeholders to fill:**
| Device | Compute (TOPS) | Power (W) | Notes |
|--------|----------------|-----------|-------|
| Raspberry Pi 5 | ~0.1 | 5-8 | BCM2712, no NPU |
| Jetson Nano | 0.5 | 5-10 | Maxwell GPU, 128 CUDA |
| Coral TPU | 4.0 | 2 | Edge TPU, USB/PCIe |

**Source:** Vendor specs (static data)

### Table 6: LoRa module comparison (tab:lora_modules)
**Placeholders to fill:**
| Module | MCU Integrated | Range (km) | TX Power (mW) |
|--------|----------------|------------|---------------|
| STM32WL | Yes | 15 | 15 |
| LoRa-E5 | Yes | 10 | 20 |
| RAK3172 | Yes | 15 | 22 |

**Source:** Vendor specs (static data)

### Figure 2: End-to-end latency breakdown (fig:latency_breakdown)
**Placeholders to fill:**
- Stacked bar chart showing:
  - Inference time (with/without NPU)
  - Compression time
  - SPI transfer time
  - LoRa airtime
- Multiple scenarios (different payload sizes)

**Test:** `test_end_to_end.py`
**Data sources:** Combine QEMU + models + airtime calcs

## Section X: Comparative Analysis
All covered by Tables 4-6 above.

## Appendix A: CI/CD Blueprint
**Placeholders to fill:**
- qemu_board: "qemu_cortex_m3" or "qemu_cortex_m4"
- app_path: "firmware/zephyr-apps/stm32n6_app"
- parse_script: "analysis/parse_qemu_logs.py"

## Appendix C: Detailed MCU comparison
**Placeholders to fill:**
Extended version of Table 4 with L1 Cache info and detailed notes.

## Summary of Required Tests

1. **test_baseline_qemu.py** - Measure CPU baselines in QEMU
2. **test_npu_model.py** - Apply NPU speedup models
3. **test_lora_airtime.py** - Calculate LoRa airtime for various configs
4. **test_control_jitter.py** - Extract control loop jitter from QEMU
5. **test_end_to_end.py** - Combine all components for E2E latency
6. **generate_plots.py** - Generate all required figures
7. **populate_tables.py** - Generate LaTeX table content

## Data Files to Generate

1. `results/qemu_baseline.csv` - Raw QEMU measurements
2. `results/npu_modeled.csv` - NPU projections
3. `results/lora_airtime.csv` - Airtime calculations
4. `results/control_jitter.csv` - Jitter distributions
5. `results/e2e_latency.csv` - End-to-end breakdown
6. `figures/control_jitter_cdf.pdf` - CDF plot
7. `figures/latency_breakdown.pdf` - Stacked bar chart
8. `latex_fragments/table1_baseline.tex` - Table 1 populated
9. `latex_fragments/table2_npu.tex` - Table 2 populated
10. `latex_fragments/table3_airtime.tex` - Table 3 populated
