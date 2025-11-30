#!/usr/bin/env python3
"""
Experiment Analysis Script
Analyzes firmware performance data and generates reports
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ExperimentAnalyzer:
    """Main analyzer class for experiment data"""
    
    def __init__(self, data_dir: Path, output_dir: Path):
        self.data_dir = data_dir
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.results = {}
    
    def load_data(self, filename: str) -> Dict[str, Any]:
        """Load data from JSON file"""
        filepath = self.data_dir / filename
        
        if not filepath.exists():
            logger.error(f"Data file not found: {filepath}")
            return {}
        
        logger.info(f"Loading data from {filepath}")
        with open(filepath, 'r') as f:
            return json.load(f)
    
    def analyze_performance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze performance metrics"""
        logger.info("Analyzing performance metrics")
        
        metrics = {
            'latency_ms': [],
            'throughput_mbps': [],
            'power_mw': [],
        }
        
        # Extract metrics (placeholder logic)
        if 'measurements' in data:
            for measurement in data['measurements']:
                if 'latency' in measurement:
                    metrics['latency_ms'].append(measurement['latency'])
                if 'throughput' in measurement:
                    metrics['throughput_mbps'].append(measurement['throughput'])
                if 'power' in measurement:
                    metrics['power_mw'].append(measurement['power'])
        
        # Calculate statistics
        results = {}
        for metric_name, values in metrics.items():
            if values:
                results[metric_name] = {
                    'mean': sum(values) / len(values),
                    'min': min(values),
                    'max': max(values),
                    'count': len(values)
                }
            else:
                results[metric_name] = None
        
        return results
    
    def generate_report(self, analysis_results: Dict[str, Any]) -> str:
        """Generate markdown report"""
        logger.info("Generating report")
        
        report = ["# Experiment Analysis Report\n"]
        report.append(f"## Summary\n")
        
        for metric, stats in analysis_results.items():
            if stats:
                report.append(f"### {metric}\n")
                report.append(f"- Mean: {stats['mean']:.2f}")
                report.append(f"- Min: {stats['min']:.2f}")
                report.append(f"- Max: {stats['max']:.2f}")
                report.append(f"- Samples: {stats['count']}\n")
        
        return '\n'.join(report)
    
    def save_report(self, report: str, filename: str = "report.md"):
        """Save report to file"""
        output_path = self.output_dir / filename
        logger.info(f"Saving report to {output_path}")
        
        with open(output_path, 'w') as f:
            f.write(report)
    
    def run_analysis(self, data_file: str):
        """Run complete analysis pipeline"""
        logger.info("Starting analysis")
        
        # Load data
        data = self.load_data(data_file)
        if not data:
            logger.error("No data loaded, aborting analysis")
            return False
        
        # Analyze
        analysis_results = self.analyze_performance(data)
        
        # Generate report
        report = self.generate_report(analysis_results)
        
        # Save report
        self.save_report(report)
        
        # Save results as JSON
        results_path = self.output_dir / "results.json"
        with open(results_path, 'w') as f:
            json.dump(analysis_results, f, indent=2)
        
        logger.info("Analysis complete")
        return True


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Analyze experiment data and generate reports"
    )
    parser.add_argument(
        '--data-dir',
        type=Path,
        default=Path('data'),
        help='Directory containing data files'
    )
    parser.add_argument(
        '--output-dir',
        type=Path,
        default=Path('output'),
        help='Directory for output files'
    )
    parser.add_argument(
        '--data-file',
        type=str,
        default='experiment_data.json',
        help='Input data filename'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Create analyzer
    analyzer = ExperimentAnalyzer(args.data_dir, args.output_dir)
    
    # Run analysis
    success = analyzer.run_analysis(args.data_file)
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
