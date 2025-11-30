#!/usr/bin/env python3
"""
QEMU Log Parser for IEEE Paper Measurements
Extracts structured data and computes statistics for all paper placeholders
"""

import sys
import csv
import json
import statistics
from collections import defaultdict
from pathlib import Path
import argparse


class MeasurementParser:
    """Parse structured QEMU logs and extract measurements"""
    
    def __init__(self):
        self.measurements = defaultdict(list)
        self.control_data = []
        self.stack_data = defaultdict(list)
        self.started = False
        
    def parse_line(self, line):
        """Parse a single log line"""
        line = line.strip()
        
        # Check for measurement boundaries
        if "===MEASUREMENTS_START===" in line:
            self.started = True
            return
        if "===MEASUREMENTS_END===" in line:
            self.started = False
            return
            
        if not self.started:
            return
            
        parts = line.split(',')
        if len(parts) < 4:
            return
            
        tag = parts[0]
        
        if tag == 'MEAS' and len(parts) >= 6:
            func = parts[1]
            try:
                ns_val = int(parts[5])
                self.measurements[func].append(ns_val)
            except (ValueError, IndexError):
                pass
                
        elif tag == 'CTRL' and len(parts) >= 6:
            try:
                ns_val = int(parts[5])
                self.control_data.append(ns_val)
            except (ValueError, IndexError):
                pass
                
        elif tag == 'STACK' and len(parts) >= 6:
            thread = parts[2]
            try:
                free_bytes = int(parts[5])
                self.stack_data[thread].append(free_bytes)
            except (ValueError, IndexError):
                pass
    
    def parse_file(self, filename):
        """Parse entire log file"""
        with open(filename, 'r', errors='ignore') as f:
            for line in f:
                self.parse_line(line)
    
    def parse_stdin(self):
        """Parse from stdin"""
        for line in sys.stdin:
            self.parse_line(line)
    
    def compute_stats(self, values):
        """Compute statistics for a list of values"""
        if not values:
            return None
            
        values_sorted = sorted(values)
        count = len(values_sorted)
        
        stats = {
            'count': count,
            'mean': statistics.mean(values_sorted),
            'std': statistics.pstdev(values_sorted) if count > 1 else 0,
            'min': min(values_sorted),
            'max': max(values_sorted),
            'p50': values_sorted[int(0.50 * count)],
            'p90': values_sorted[int(0.90 * count)],
            'p95': values_sorted[int(0.95 * count)],
            'p99': values_sorted[int(0.99 * count)] if count > 1 else values_sorted[-1],
        }
        return stats
    
    def generate_report(self):
        """Generate comprehensive report"""
        report = {
            'baseline': {},
            'control': {},
            'stack': {}
        }
        
        # Process measurements
        for func, values in self.measurements.items():
            stats = self.compute_stats(values)
            if stats:
                report['baseline'][func] = stats
        
        # Process control data
        if self.control_data:
            report['control'] = self.compute_stats(self.control_data)
        
        # Process stack data
        for thread, values in self.stack_data.items():
            stats = self.compute_stats(values)
            if stats:
                report['stack'][thread] = stats
        
        return report
    
    def print_csv_baseline(self):
        """Print baseline table in CSV format"""
        print("Function,Mean_ns,Std_ns,p50_ns,p90_ns,p99_ns")
        for func, values in sorted(self.measurements.items()):
            stats = self.compute_stats(values)
            if stats:
                print(f"{func},{stats['mean']:.0f},{stats['std']:.0f},"
                      f"{stats['p50']},{stats['p90']},{stats['p99']}")
    
    def print_latex_table1(self):
        """Generate LaTeX for Table 1 (baseline)"""
        print("% Table 1: CPU-only software latency baseline")
        print("\\begin{tabular}{lcccc}")
        print("\\toprule")
        print("Function & Mean (ns) & Std (ns) & p90 (ns) & p99 (ns) \\\\")
        print("\\midrule")
        
        func_order = ['inference', 'event_extract', 'compress', 'spi_prep', 'control']
        func_names = {
            'inference': 'Inference (CPU-only)',
            'event_extract': 'Event extraction',
            'compress': 'Compression (SW fallback)',
            'spi_prep': 'SPI packet prep',
            'control': 'Control loop handler'
        }
        
        for func in func_order:
            if func in self.measurements:
                stats = self.compute_stats(self.measurements[func])
                if stats:
                    name = func_names.get(func, func)
                    print(f"{name} & {stats['mean']:.0f} & {stats['std']:.0f} & "
                          f"{stats['p90']} & {stats['p99']} \\\\")
        
        print("\\bottomrule")
        print("\\end{tabular}")


def main():
    parser = argparse.ArgumentParser(
        description='Parse QEMU logs for IEEE paper measurements'
    )
    parser.add_argument(
        '--input', '-i',
        help='Input log file (default: stdin)',
        default=None
    )
    parser.add_argument(
        '--output', '-o',
        help='Output format',
        choices=['json', 'csv', 'latex', 'all'],
        default='json'
    )
    parser.add_argument(
        '--output-file',
        help='Output file (default: stdout)',
        default=None
    )
    
    args = parser.parse_args()
    
    # Parse logs
    mp = MeasurementParser()
    if args.input:
        mp.parse_file(args.input)
    else:
        mp.parse_stdin()
    
    # Generate output
    if args.output_file:
        sys.stdout = open(args.output_file, 'w')
    
    if args.output == 'json' or args.output == 'all':
        report = mp.generate_report()
        print(json.dumps(report, indent=2))
        if args.output == 'all':
            print("\n" + "="*60 + "\n")
    
    if args.output == 'csv' or args.output == 'all':
        mp.print_csv_baseline()
        if args.output == 'all':
            print("\n" + "="*60 + "\n")
    
    if args.output == 'latex' or args.output == 'all':
        mp.print_latex_table1()


if __name__ == '__main__':
    main()
