#!/usr/bin/env python3
"""
Generate plots for IEEE paper figures
Creates publication-quality PDF plots
"""

import json
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
from pathlib import Path
import argparse


# Set publication style
plt.style.use('seaborn-v0_8-paper')
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.size'] = 9
plt.rcParams['figure.dpi'] = 300


class PlotGenerator:
    """Generate all IEEE paper plots"""
    
    def __init__(self, output_dir='figures'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def plot_control_jitter_cdf(self, control_data, filename='control_jitter_cdf.pdf'):
        """
        Generate Figure 1: Control loop jitter CDF
        
        Args:
            control_data: List of control loop latencies in ns
            filename: Output filename
        """
        if not control_data:
            print("Warning: No control data provided")
            return
        
        # Sort data for CDF
        sorted_data = np.sort(control_data) / 1000.0  # Convert to microseconds
        cdf = np.arange(1, len(sorted_data) + 1) / len(sorted_data)
        
        fig, ax = plt.subplots(figsize=(3.5, 2.5))
        
        ax.plot(sorted_data, cdf, linewidth=1.5, color='#2E86AB')
        ax.grid(True, alpha=0.3, linestyle='--')
        
        ax.set_xlabel('Control Loop Latency (μs)')
        ax.set_ylabel('CDF')
        ax.set_title('Control Loop Jitter Distribution')
        
        # Add percentile annotations
        p90_idx = int(0.90 * len(sorted_data))
        p99_idx = int(0.99 * len(sorted_data))
        
        ax.axvline(sorted_data[p90_idx], color='orange', linestyle='--', 
                   alpha=0.7, label=f'P90: {sorted_data[p90_idx]:.1f} μs')
        ax.axvline(sorted_data[p99_idx], color='red', linestyle='--', 
                   alpha=0.7, label=f'P99: {sorted_data[p99_idx]:.1f} μs')
        
        ax.legend(fontsize=8)
        plt.tight_layout()
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, bbox_inches='tight')
        print(f"Saved: {output_path}")
        plt.close()
    
    def plot_latency_breakdown(self, breakdown_data, filename='latency_breakdown.pdf'):
        """
        Generate Figure 2: End-to-end latency breakdown (stacked bar)
        
        Args:
            breakdown_data: List of dicts with component latencies
            filename: Output filename
        """
        if not breakdown_data:
            print("Warning: No breakdown data provided")
            return
        
        # Extract data
        scenarios = [d['scenario'] for d in breakdown_data]
        inference = [d['inference_ms'] for d in breakdown_data]
        compression = [d['compression_ms'] for d in breakdown_data]
        spi = [d['spi_ms'] for d in breakdown_data]
        airtime = [d['airtime_ms'] for d in breakdown_data]
        
        # Create stacked bar chart
        fig, ax = plt.subplots(figsize=(7, 3))
        
        x = np.arange(len(scenarios))
        width = 0.6
        
        # Stack components
        p1 = ax.bar(x, inference, width, label='Inference', color='#A23B72')
        p2 = ax.bar(x, compression, width, bottom=inference, label='Compression', color='#F18F01')
        
        bottom2 = np.array(inference) + np.array(compression)
        p3 = ax.bar(x, spi, width, bottom=bottom2, label='SPI Transfer', color='#C73E1D')
        
        bottom3 = bottom2 + np.array(spi)
        p4 = ax.bar(x, airtime, width, bottom=bottom3, label='LoRa Airtime', color='#2E86AB')
        
        ax.set_ylabel('Latency (ms)')
        ax.set_title('End-to-End Pipeline Latency Breakdown')
        ax.set_xticks(x)
        ax.set_xticklabels(scenarios, rotation=45, ha='right')
        ax.legend(loc='upper left', fontsize=8)
        ax.grid(True, alpha=0.3, axis='y')
        
        plt.tight_layout()
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, bbox_inches='tight')
        print(f"Saved: {output_path}")
        plt.close()
    
    def generate_sample_plots(self):
        """Generate sample plots with synthetic data for demonstration"""
        
        # Sample control jitter data (microseconds)
        np.random.seed(42)
        control_ns = np.concatenate([
            np.random.normal(5000, 500, 900),  # Main cluster
            np.random.normal(8000, 1000, 100)   # Tail
        ])
        
        self.plot_control_jitter_cdf(control_ns)
        
        # Sample latency breakdown
        breakdown = [
            {
                'scenario': '100B\nSF7',
                'inference_ms': 45.2,
                'compression_ms': 12.3,
                'spi_ms': 2.1,
                'airtime_ms': 61.7
            },
            {
                'scenario': '500B\nSF7',
                'inference_ms': 45.2,
                'compression_ms': 28.4,
                'spi_ms': 4.2,
                'airtime_ms': 287.8
            },
            {
                'scenario': '500B\nSF9',
                'inference_ms': 45.2,
                'compression_ms': 28.4,
                'spi_ms': 4.2,
                'airtime_ms': 616.4
            },
            {
                'scenario': '1000B\nSF7',
                'inference_ms': 45.2,
                'compression_ms': 52.1,
                'spi_ms': 7.8,
                'airtime_ms': 534.5
            },
        ]
        
        self.plot_latency_breakdown(breakdown)


def main():
    parser = argparse.ArgumentParser(
        description='Generate plots for IEEE paper'
    )
    parser.add_argument(
        '--baseline',
        help='Baseline JSON file (from parse_qemu_logs.py)'
    )
    parser.add_argument(
        '--e2e',
        help='End-to-end breakdown JSON file'
    )
    parser.add_argument(
        '--output-dir', '-o',
        default='figures',
        help='Output directory for plots'
    )
    parser.add_argument(
        '--sample',
        action='store_true',
        help='Generate sample plots with synthetic data'
    )
    
    args = parser.parse_args()
    
    plotter = PlotGenerator(output_dir=args.output_dir)
    
    if args.sample:
        print("Generating sample plots...")
        plotter.generate_sample_plots()
        return
    
    # Load and plot real data
    if args.baseline:
        with open(args.baseline, 'r') as f:
            data = json.load(f)
        
        if 'control' in data and data['control']:
            # Generate control jitter CDF from real data
            # Note: Would need raw values, not just stats
            print("Control jitter plot requires raw data points")
    
    if args.e2e:
        with open(args.e2e, 'r') as f:
            breakdown = json.load(f)
        
        plotter.plot_latency_breakdown(breakdown)


if __name__ == '__main__':
    main()
