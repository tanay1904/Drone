#!/usr/bin/env python3
"""
Plot parsed QEMU measurement results.
This script expects a CSV with columns:
    func, value_ns
"""

import csv
import sys
import matplotlib.pyplot as plt


def load_data(filepath):
    """Load measurements from CSV."""
    data = {}
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 2:
                continue
            func, val = row[0], int(row[1])
            if func not in data:
                data[func] = []
            data[func].append(val)
    return data


def plot_data(data):
    """Plot measurement distributions."""
    funcs = list(data.keys())
    means = [sum(vals) / len(vals) for vals in data.values()]

    plt.figure(figsize=(10, 5))
    plt.bar(funcs, means)
    plt.title("Average Latency per Function")
    plt.ylabel("Latency (ns)")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: plot_results.py <parsed.csv>")
        sys.exit(1)

    filepath = sys.argv[1]
    data = load_data(filepath)
    plot_data(data)


if __name__ == "__main__":
    main()
