#!/usr/bin/env python3
# tools/plot_results.py
import argparse
import glob
import os
import pandas as pd
import matplotlib.pyplot as plt

def plot_latency_hist(csv_path, outdir):
    df = pd.read_csv(csv_path)
    # expect column 'latency_ms' or try to auto-detect plausible numeric columns
    col = None
    for candidate in ['latency_ms', 'latency', 'latency_us', 'time_ms']:
        if candidate in df.columns:
            col = candidate
            break
    if col is None:
        # pick first numeric column
        numeric = df.select_dtypes(include=['number']).columns
        if len(numeric) == 0:
            print(f"no numeric columns in {csv_path}, skipping")
            return
        col = numeric[0]
    data = df[col].dropna()
    if data.empty:
        print(f"no data in {csv_path} for column {col}")
        return
    plt.figure(figsize=(6,4))
    plt.hist(data, bins=40)
    plt.title(os.path.basename(csv_path))
    plt.xlabel(col)
    plt.ylabel("count")
    outpath = os.path.join(outdir, os.path.basename(csv_path).replace('.csv', f'.{col}.hist.png'))
    plt.tight_layout()
    plt.savefig(outpath)
    plt.close()
    print("Wrote", outpath)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--input', required=True, help='path to parsed CSVs directory')
    p.add_argument('--outdir', required=True, help='where to write plots')
    args = p.parse_args()
    os.makedirs(args.outdir, exist_ok=True)
    csvs = glob.glob(os.path.join(args.input, '*.csv'))
    if not csvs:
        print("No CSVs found in", args.input)
        return
    for c in csvs:
        try:
            plot_latency_hist(c, args.outdir)
        except Exception as e:
            print("Failed plotting", c, e)

if __name__ == '__main__':
    main()
