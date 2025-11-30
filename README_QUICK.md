# IEEE Paper Results Generation

## Quick Start

```bash
cd analysis
./generate_paper_results.py
```

Generates all tables, figures, and LaTeX fragments for the paper.

## Hardware Measurements

### LoRa E5 Mini
```bash
cd firmware/zephyr-apps/lora_e5_measurements
west build -b lora_e5_mini
west flash
# Log output, then:
./analysis/parse_lora_hardware.py < lora.log > lora_hw.json
```

### QEMU Baseline
```bash
cd firmware/zephyr-apps/stm32n6_app
west build -b qemu_cortex_m3
west build -t run > qemu.log
./analysis/parse_qemu_logs.py -i qemu.log -o json > baseline.json
```

## Output

```
paper_results/
├── latex_fragments/  # Copy to paper
├── figures/          # Copy to paper
└── results/          # Raw data
```

## Scripts

- `parse_qemu_logs.py` - Table 1
- `model_npu.py` - Table 2  
- `calculate_lora_airtime.py` - Table 3 (analytical)
- `parse_lora_hardware.py` - Table 3 (hardware)
- `generate_comparison_tables.py` - Tables 4,5,6
- `generate_plots.py` - Figures
- `generate_paper_results.py` - All above

## CI/CD

Push to GitHub → Actions → Download "ieee-paper-results" artifact
