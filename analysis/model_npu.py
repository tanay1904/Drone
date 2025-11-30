#!/usr/bin/env python3
"""
NPU Latency Modeling for IEEE Paper Table 2
Applies speedup factors to CPU baselines to project NPU performance
"""

import json
import sys
import argparse
from pathlib import Path


class NPUModeler:
    """Model NPU latencies from CPU baselines"""
    
    def __init__(self, speedup_low=8.0, speedup_high=20.0):
        """
        Initialize with conservative speedup bounds
        
        Args:
            speedup_low: Conservative (pessimistic) NPU speedup factor
            speedup_high: Optimistic NPU speedup factor
        """
        self.speedup_low = speedup_low
        self.speedup_high = speedup_high
    
    def model_npu_latency(self, cpu_latency_ns):
        """
        Project NPU latency from CPU baseline
        
        Args:
            cpu_latency_ns: CPU-only latency in nanoseconds
            
        Returns:
            dict with 'low' and 'high' NPU projections
        """
        npu_low = cpu_latency_ns / self.speedup_high  # High speedup = low latency
        npu_high = cpu_latency_ns / self.speedup_low  # Low speedup = high latency
        
        return {
            'npu_low_ns': int(npu_low),
            'npu_high_ns': int(npu_high),
            'speedup_low': self.speedup_low,
            'speedup_high': self.speedup_high
        }
    
    def process_baseline(self, baseline_data):
        """
        Process baseline measurements and generate NPU projections
        
        Args:
            baseline_data: Dict with baseline measurements
            
        Returns:
            Dict with NPU projections for each percentile
        """
        if 'baseline' not in baseline_data:
            raise ValueError("No baseline data found")
        
        if 'inference' not in baseline_data['baseline']:
            raise ValueError("No inference measurements found")
        
        inference_stats = baseline_data['baseline']['inference']
        
        results = {
            'cpu_baseline': inference_stats,
            'npu_projections': {},
            'parameters': {
                'speedup_low': self.speedup_low,
                'speedup_high': self.speedup_high
            }
        }
        
        # Model for each percentile
        for percentile in ['p50', 'p90', 'p99']:
            if percentile in inference_stats:
                cpu_latency = inference_stats[percentile]
                npu_model = self.model_npu_latency(cpu_latency)
                npu_model['cpu_baseline_ns'] = cpu_latency
                npu_model['percentile'] = percentile
                results['npu_projections'][percentile] = npu_model
        
        return results
    
    def print_latex_table2(self, results):
        """Generate LaTeX for Table 2 (NPU modeled)"""
        print("% Table 2: Modeled NPU latencies")
        print("\\begin{tabular}{lccc}")
        print("\\toprule")
        print("Baseline (percentile) & Modeled NPU (Low) & Modeled NPU (High) & Notes \\\\")
        print("\\midrule")
        
        proj = results['npu_projections']
        params = results['parameters']
        
        for perc in ['p50', 'p90', 'p99']:
            if perc in proj:
                p = proj[perc]
                cpu_us = p['cpu_baseline_ns'] / 1000.0
                npu_low_us = p['npu_low_ns'] / 1000.0
                npu_high_us = p['npu_high_ns'] / 1000.0
                
                note = f"{params['speedup_low']:.0f}-{params['speedup_high']:.0f}x speedup"
                
                print(f"{perc.upper()} & {npu_low_us:.1f} $\\mu$s & "
                      f"{npu_high_us:.1f} $\\mu$s & {note} \\\\")
        
        print("\\bottomrule")
        print("\\end{tabular}")
    
    def print_csv(self, results):
        """Print results as CSV"""
        print("Percentile,CPU_Baseline_ns,NPU_Low_ns,NPU_High_ns,Speedup_Low,Speedup_High")
        
        proj = results['npu_projections']
        
        for perc in ['p50', 'p90', 'p99']:
            if perc in proj:
                p = proj[perc]
                print(f"{perc},{p['cpu_baseline_ns']},{p['npu_low_ns']},"
                      f"{p['npu_high_ns']},{p['speedup_low']},{p['speedup_high']}")


def main():
    parser = argparse.ArgumentParser(
        description='Model NPU latencies from CPU baselines'
    )
    parser.add_argument(
        '--baseline', '-b',
        required=True,
        help='Baseline JSON file from parse_qemu_logs.py'
    )
    parser.add_argument(
        '--speedup-low',
        type=float,
        default=8.0,
        help='Conservative NPU speedup factor (default: 8.0)'
    )
    parser.add_argument(
        '--speedup-high',
        type=float,
        default=20.0,
        help='Optimistic NPU speedup factor (default: 20.0)'
    )
    parser.add_argument(
        '--output', '-o',
        choices=['json', 'csv', 'latex', 'all'],
        default='json',
        help='Output format'
    )
    
    args = parser.parse_args()
    
    # Load baseline data
    with open(args.baseline, 'r') as f:
        baseline_data = json.load(f)
    
    # Create modeler
    modeler = NPUModeler(
        speedup_low=args.speedup_low,
        speedup_high=args.speedup_high
    )
    
    # Process
    results = modeler.process_baseline(baseline_data)
    
    # Output
    if args.output == 'json' or args.output == 'all':
        print(json.dumps(results, indent=2))
        if args.output == 'all':
            print("\n" + "="*60 + "\n")
    
    if args.output == 'csv' or args.output == 'all':
        modeler.print_csv(results)
        if args.output == 'all':
            print("\n" + "="*60 + "\n")
    
    if args.output == 'latex' or args.output == 'all':
        modeler.print_latex_table2(results)


if __name__ == '__main__':
    main()
