# IEEE Paper Results Generation

Complete system for populating all placeholders in the IEEE conference paper.

## Overview

This directory contains scripts to generate **all** measurements, models, tables, and figures required for the IEEE paper titled:

> "Energy-Efficient STM32N6-Based Architecture for Edge AI in Long-Range Autonomous Systems: A Pre-Silicon Evaluation Using Zephyr RTOS, QEMU Emulation, and CI/CD Automation"

## What Gets Generated

### Tables
1. **Table 1**: CPU-only software latency baseline (from QEMU)
2. **Table 2**: Modeled NPU latencies (analytical model)
3. **Table 3**: LoRa airtime per payload (Semtech formula)
4. **Table 4**: MCU family comparison (static datasheet data)
5. **Table 5**: SBC comparison (static datasheet data)
6. **Table 6**: LoRa module comparison (static datasheet data)

### Figures
1. **Figure 1**: Control loop jitter CDF
2. **Figure 2**: End-to-end latency breakdown (stacked bar)

### Additional
- Appendix C: Detailed MCU comparison matrix
- All numerical placeholders filled with actual values

## Quick Start

### One-Command Generation

```bash
# Generate everything
./generate_paper_results.py --output-dir paper_results
```

This runs the entire pipeline:
1. Simulates QEMU runs (or uses real logs if available)
2. Parses structured logs
3. Models NPU latencies
4. Calculates LoRa airtimes
5. Generates comparison tables
6. Creates plots
7. Outputs LaTeX fragments

### Output Structure

```
paper_results/
├── results/                 # JSON data files
│   ├── baseline.json        # QEMU baseline measurements
│   ├── npu_modeled.json     # NPU projections
│   ├── lora_airtime.json    # Airtime calculations
│   └── comparisons.json     # Static comparison data
├── latex_fragments/         # Ready-to-use LaTeX
│   ├── table1_baseline.tex
│   ├── table2_npu.tex
│   ├── table3_airtime.tex
│   ├── table4_comparison.tex
│   ├── table5_comparison.tex
│   └── table6_comparison.tex
├── figures/                 # Publication-quality PDFs
│   ├── control_jitter_cdf.pdf
│   └── latency_breakdown.pdf
└── RESULTS_SUMMARY.md       # Overview of generated files
```

## Individual Scripts

### 1. Parse QEMU Logs

```bash
# Parse structured logs from QEMU runs
./parse_qemu_logs.py --input qemu.log --output json > baseline.json

# Generate LaTeX for Table 1
./parse_qemu_logs.py --input qemu.log --output latex > table1.tex
```

**Generates:** Table 1 data (CPU baselines)

### 2. Model NPU Latencies

```bash
# Apply speedup factors to CPU baselines
./model_npu.py --baseline baseline.json --output latex > table2.tex

# Adjust speedup bounds
./model_npu.py --baseline baseline.json \
  --speedup-low 8.0 --speedup-high 20.0 \
  --output json > npu_modeled.json
```

**Generates:** Table 2 data (NPU projections)

### 3. Calculate LoRa Airtimes

```bash
# Generate all airtime scenarios
./calculate_lora_airtime.py --output latex > table3.tex

# Calculate single payload
./calculate_lora_airtime.py --payload 500 --sf 7 --bw 125
```

**Generates:** Table 3 data (LoRa airtimes)

### 4. Generate Comparison Tables

```bash
# All comparison tables (MCU, SBC, LoRa)
./generate_comparison_tables.py --output latex --table all

# Individual tables
./generate_comparison_tables.py --table 4  # MCU only
./generate_comparison_tables.py --table 5  # SBC only
./generate_comparison_tables.py --table 6  # LoRa only

# Export as JSON
./generate_comparison_tables.py --output json > comparisons.json
```

**Generates:** Tables 4, 5, 6 (hardware comparisons)

### 5. Generate Plots

```bash
# Generate all figures with sample data
./generate_plots.py --sample --output-dir figures/

# Use real data
./generate_plots.py --baseline baseline.json --output-dir figures/
```

**Generates:** Figures 1 & 2 (PDF plots)

## Integration with IEEE Paper

### Method 1: Direct Copy-Paste

1. Run `./generate_paper_results.py`
2. Open `paper_results/latex_fragments/table1_baseline.tex`
3. Copy the table content
4. Replace the placeholder in your main LaTeX file

### Method 2: LaTeX Include

In your main paper:

```latex
% Instead of placeholder table:
\begin{table*}[t]
\centering
\caption{CPU-only software latency baseline}
\label{tab:qemu_baseline}
\input{latex_fragments/table1_baseline}
\end{table*}
```

### Method 3: Automated Replacement Script

```bash
# TODO: Create sed/awk script to replace all placeholders automatically
./replace_placeholders.sh paper.tex paper_results/
```

## CI/CD Integration

The CI/CD pipeline (`.github/workflows/ci.yml`) automatically:

1. Builds firmware
2. Runs QEMU
3. Generates all paper results
4. Uploads artifacts

Download artifacts from GitHub Actions:
- Go to Actions tab
- Select latest workflow run
- Download `ieee-paper-results` artifact

## Placeholder Mapping

| Paper Section | Placeholder Type | Script | Output File |
|---------------|------------------|--------|-------------|
| Table 1 | CPU baselines | `parse_qemu_logs.py` | `table1_baseline.tex` |
| Table 2 | NPU modeled | `model_npu.py` | `table2_npu.tex` |
| Table 3 | LoRa airtime | `calculate_lora_airtime.py` | `table3_airtime.tex` |
| Table 4 | MCU comparison | `generate_comparison_tables.py` | `table4_comparison.tex` |
| Table 5 | SBC comparison | `generate_comparison_tables.py` | `table5_comparison.tex` |
| Table 6 | LoRa modules | `generate_comparison_tables.py` | `table6_comparison.tex` |
| Figure 1 | Control jitter | `generate_plots.py` | `control_jitter_cdf.pdf` |
| Figure 2 | Latency breakdown | `generate_plots.py` | `latency_breakdown.pdf` |
| Appendix A | CI blueprint | Manual | (in paper source) |
| Appendix C | Detailed MCU | `generate_comparison_tables.py` | (included) |

## Dependencies

```bash
# Python packages
pip install numpy matplotlib scipy pandas

# For actual QEMU runs
sudo apt install qemu-system-arm

# For Zephyr builds
pip install west
```

## Customization

### Adjust NPU Speedup Factors

Edit in `model_npu.py` or pass as arguments:

```python
--speedup-low 8.0    # Conservative estimate
--speedup-high 20.0  # Optimistic estimate
```

### Change LoRa Parameters

Edit `calculate_lora_airtime.py`:

```python
# Modify payload sizes, SF, BW combinations
configs = [
    (payload_bytes, SF, BW_Hz),
    # Add your scenarios
]
```

### Update Hardware Comparison Data

Edit `generate_comparison_tables.py`:

```python
self.mcu_data = [
    {
        'mcu': 'STM32N6',
        'core': 'Cortex-M55',
        # Update with latest datasheet values
    }
]
```

## Validation

### Check Table Formatting

```bash
# Compile LaTeX fragments
pdflatex table1_baseline.tex
# Verify output
```

### Verify Numerical Consistency

```bash
# All calculations should be deterministic
./generate_paper_results.py --output-dir test1
./generate_paper_results.py --output-dir test2
diff -r test1/results test2/results
```

## Troubleshooting

### "No measurements found"

- Check that QEMU log contains `===MEASUREMENTS_START===` markers
- Verify structured logging format: `MEAS,function,iter,N,ns,VALUE`

### "Module not found"

```bash
pip install numpy matplotlib scipy pandas
```

### "Permission denied"

```bash
chmod +x *.py
```

### Plots not generating

```bash
# Check matplotlib backend
python3 -c "import matplotlib; print(matplotlib.get_backend())"

# Should show 'Agg' for headless systems
```

## Contributing

When adding new measurements:

1. Add structured logging to firmware
2. Update parsing script
3. Add to master orchestration script
4. Update this README
5. Update paper placeholder list

## References

- [Zephyr RTOS Docs](https://docs.zephyrproject.org/)
- [Semtech LoRa Modem Calculator](https://www.semtech.com/design-support/lora-calculator)
- [STM32N6 Datasheet](https://www.st.com/stm32n6)
- [IEEE Conference Paper Format](https://www.ieee.org/conferences/publishing/templates.html)

## License

Same as parent repository.
