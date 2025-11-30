#!/usr/bin/env python3
import argparse
import csv
import os
from typing import List, Dict
import matplotlib.pyplot as plt


def read_csv(path: str) -> List[Dict[str, str]]:
    """Read parsed CSV log file and return list of dictionaries."""
    rows = []
    with open(path, "r") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    return rows


def extract_values(rows: List[Dict[str, str]], key: str) -> List[float]:
    """Extract float values from a column in the CSV."""
    return [float(row[key]) for row in rows if key in row]


def plot_histogram(values: List[float], title: str, output_path: str) -> None:
    """Plot a histogram of values."""
    plt.figure(figsize=(8, 4))
    plt.hist(values, bins=40)
    plt.title(title)
    plt.xlabel("Value")
    plt.ylabel("Frequency")
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()


def plot_cdf(values: List[float], title: str, output_path: str) -> None:
    """Plot a CDF curve."""
    values_sorted = sorted(values)
    n = len(values_sorted)
    y_vals = [i / n for i in range(n)]

    plt.figure(figsize=(8, 4))
    plt.plot(values_sorted, y_vals)
    plt.title(title)
    plt.xlabel("Value")
    plt.ylabel("CDF")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Path to parsed CSV log")
    parser.add_argument("--outdir", required=True, help="Output images directory")
    args = parser.parse_args()

    rows = read_csv(args.csv)

    if not os.path.exists(args.outdir):
        os.makedirs(args.outdir)

    # Example: latency histogram
    if "latency_ns" in rows[0]:
        values = extract_values(rows, "latency_ns")
        plot_histogram(
            values,
            "Latency Distribution (ns)",
            os.path.join(args.outdir, "latency_hist.png"),
        )
        plot_cdf(
            values,
            "Latency CDF (ns)",
            os.path.join(args.outdir, "latency_cdf.png"),
        )


if __name__ == "__main__":
    main()
