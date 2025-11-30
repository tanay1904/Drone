#!/usr/bin/env python3
"""
Generate static comparison tables for IEEE paper
Tables 4, 5, 6 with MCU/SBC/LoRa comparisons
"""

import json
import csv
from io import StringIO


class ComparisonTables:
    """Generate comparison tables with static data from datasheets"""
    
    def __init__(self):
        # Table 4: MCU Family Comparison
        self.mcu_data = [
            {
                'mcu': 'STM32F4',
                'core': 'Cortex-M4',
                'max_freq_mhz': 180,
                'sram_kb': 256,
                'flash_kb': 2048,
                'npu': 'No',
                'hw_h264': 'No',
                'l1_cache': '16KB I + 16KB D',
                'notes': 'General purpose MCU'
            },
            {
                'mcu': 'STM32U5',
                'core': 'Cortex-M33',
                'max_freq_mhz': 160,
                'sram_kb': 2560,
                'flash_kb': 4096,
                'npu': 'No',
                'hw_h264': 'No',
                'l1_cache': '16KB I + 16KB D',
                'notes': 'Ultra-low-power with TrustZone'
            },
            {
                'mcu': 'STM32H7',
                'core': 'Cortex-M7',
                'max_freq_mhz': 550,
                'sram_kb': 1024,
                'flash_kb': 2048,
                'npu': 'No',
                'hw_h264': 'Yes',
                'l1_cache': '16KB I + 16KB D',
                'notes': 'High-performance with JPEG/H.264'
            },
            {
                'mcu': 'STM32N6',
                'core': 'Cortex-M55',
                'max_freq_mhz': 600,
                'sram_kb': 2560,
                'flash_kb': 2048,
                'npu': 'Yes',
                'hw_h264': 'Yes',
                'l1_cache': '32KB I + 32KB D',
                'notes': 'Neural-ART accelerator, Helium'
            },
            {
                'mcu': 'ESP32-S3',
                'core': 'Xtensa LX7',
                'max_freq_mhz': 240,
                'sram_kb': 512,
                'flash_kb': 384,
                'npu': 'No',
                'hw_h264': 'No',
                'l1_cache': '32KB I + 32KB D',
                'notes': 'Dual-core with WiFi/BLE'
            },
        ]
        
        # Table 5: SBC Comparison
        self.sbc_data = [
            {
                'device': 'Raspberry Pi 5',
                'compute_tops': 0.1,
                'power_w': '5-8',
                'notes': 'BCM2712 quad-core, no dedicated NPU'
            },
            {
                'device': 'Jetson Nano',
                'compute_tops': 0.5,
                'power_w': '5-10',
                'notes': 'Maxwell GPU, 128 CUDA cores'
            },
            {
                'device': 'Coral TPU',
                'compute_tops': 4.0,
                'power_w': '2',
                'notes': 'Edge TPU accelerator, USB/PCIe/M.2'
            },
        ]
        
        # Table 6: LoRa Module Comparison
        self.lora_data = [
            {
                'module': 'STM32WL',
                'mcu_integrated': 'Yes',
                'range_km': 15,
                'tx_power_mw': 15,
                'notes': 'Cortex-M4 + sub-GHz radio'
            },
            {
                'module': 'LoRa-E5',
                'mcu_integrated': 'Yes',
                'range_km': 10,
                'tx_power_mw': 20,
                'notes': 'STM32WLE5JC module'
            },
            {
                'module': 'RAK3172',
                'mcu_integrated': 'Yes',
                'range_km': 15,
                'tx_power_mw': 22,
                'notes': 'STM32WLE5CC based'
            },
        ]
    
    def print_latex_table4(self):
        """Generate LaTeX for Table 4 (MCU family)"""
        print("% Table 4: MCU family feature comparison")
        print("\\begin{tabular}{lcccccc}")
        print("\\toprule")
        print("MCU & Core & Max Freq (MHz) & SRAM (KB) & Flash (KB) & NPU & HW H.264 \\\\")
        print("\\midrule")
        
        for mcu in self.mcu_data:
            print(f"{mcu['mcu']} & {mcu['core']} & {mcu['max_freq_mhz']} & "
                  f"{mcu['sram_kb']} & {mcu['flash_kb']} & {mcu['npu']} & {mcu['hw_h264']} \\\\")
        
        print("\\bottomrule")
        print("\\end{tabular}")
    
    def print_latex_table4_detailed(self):
        """Generate LaTeX for detailed MCU table (Appendix C)"""
        print("% Detailed MCU characteristics (Appendix C)")
        print("\\begin{tabular}{lcccccccc}")
        print("\\toprule")
        print("MCU & Core & Freq (MHz) & L1 Cache & SRAM (KB) & Flash (KB) & NPU & HW Video & Notes \\\\")
        print("\\midrule")
        
        for mcu in self.mcu_data:
            print(f"{mcu['mcu']} & {mcu['core']} & {mcu['max_freq_mhz']} & "
                  f"{mcu['l1_cache']} & {mcu['sram_kb']} & {mcu['flash_kb']} & "
                  f"{mcu['npu']} & {mcu['hw_h264']} & {mcu['notes']} \\\\")
        
        print("\\bottomrule")
        print("\\end{tabular}")
    
    def print_latex_table5(self):
        """Generate LaTeX for Table 5 (SBC comparison)"""
        print("% Table 5: SBC feature comparison")
        print("\\begin{tabular}{lccc}")
        print("\\toprule")
        print("Device & Compute (TOPS) & Power (W) & Notes \\\\")
        print("\\midrule")
        
        for sbc in self.sbc_data:
            print(f"{sbc['device']} & {sbc['compute_tops']} & {sbc['power_w']} & {sbc['notes']} \\\\")
        
        print("\\bottomrule")
        print("\\end{tabular}")
    
    def print_latex_table6(self):
        """Generate LaTeX for Table 6 (LoRa modules)"""
        print("% Table 6: LoRa module comparison")
        print("\\begin{tabular}{lccc}")
        print("\\toprule")
        print("Module & MCU Integrated & Range (km) & TX Power (mW) \\\\")
        print("\\midrule")
        
        for lora in self.lora_data:
            print(f"{lora['module']} & {lora['mcu_integrated']} & {lora['range_km']} & {lora['tx_power_mw']} \\\\")
        
        print("\\bottomrule")
        print("\\end{tabular}")
    
    def export_all_json(self):
        """Export all tables as JSON"""
        return {
            'mcu_comparison': self.mcu_data,
            'sbc_comparison': self.sbc_data,
            'lora_comparison': self.lora_data
        }
    
    def export_all_csv(self):
        """Export all tables as CSV"""
        output = StringIO()
        
        # MCU table
        output.write("=== MCU Comparison ===\n")
        writer = csv.DictWriter(output, fieldnames=self.mcu_data[0].keys())
        writer.writeheader()
        writer.writerows(self.mcu_data)
        output.write("\n")
        
        # SBC table
        output.write("=== SBC Comparison ===\n")
        writer = csv.DictWriter(output, fieldnames=self.sbc_data[0].keys())
        writer.writeheader()
        writer.writerows(self.sbc_data)
        output.write("\n")
        
        # LoRa table
        output.write("=== LoRa Module Comparison ===\n")
        writer = csv.DictWriter(output, fieldnames=self.lora_data[0].keys())
        writer.writeheader()
        writer.writerows(self.lora_data)
        
        return output.getvalue()


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Generate comparison tables for IEEE paper'
    )
    parser.add_argument(
        '--output', '-o',
        choices=['json', 'csv', 'latex', 'all'],
        default='latex',
        help='Output format'
    )
    parser.add_argument(
        '--table', '-t',
        choices=['4', '5', '6', 'all'],
        default='all',
        help='Which table to generate'
    )
    
    args = parser.parse_args()
    
    tables = ComparisonTables()
    
    if args.output == 'json':
        data = tables.export_all_json()
        print(json.dumps(data, indent=2))
        return
    
    if args.output == 'csv':
        print(tables.export_all_csv())
        return
    
    # LaTeX output
    if args.table == '4' or args.table == 'all':
        tables.print_latex_table4()
        if args.table == 'all':
            print("\n" + "="*60 + "\n")
    
    if args.table == '5' or args.table == 'all':
        tables.print_latex_table5()
        if args.table == 'all':
            print("\n" + "="*60 + "\n")
    
    if args.table == '6' or args.table == 'all':
        tables.print_latex_table6()
        if args.table == 'all':
            print("\n" + "="*60 + "\n")
    
    # Also print detailed table for appendix
    if args.table == 'all':
        print("\n=== Appendix C: Detailed MCU Table ===\n")
        tables.print_latex_table4_detailed()


if __name__ == '__main__':
    main()
