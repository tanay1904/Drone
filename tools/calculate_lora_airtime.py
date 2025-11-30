#!/usr/bin/env python3
"""
LoRa Airtime Calculator for IEEE Paper Table 3
Implements Semtech airtime formula from Appendix D
"""

import math
import json
import argparse


class LoRaAirtimeCalculator:
    """Calculate LoRa airtime using Semtech formula"""

    def __init__(self):
        pass

    def calculate_airtime(self, payload_bytes, sf, bw_hz, cr=1, preamble_len=8,
                          explicit_header=True, crc=True, low_data_rate_opt=False):
        """
        Calculate LoRa airtime using Semtech formula

        Args:
            payload_bytes: Payload size in bytes
            sf: Spreading factor (7-12)
            bw_hz: Bandwidth in Hz (125000, 250000, 500000)
            cr: Coding rate (1-4, where 1 = 4/5, 2 = 4/6, etc.)
            preamble_len: Preamble length in symbols
            explicit_header: Use explicit header
            crc: Enable CRC
            low_data_rate_opt: Low data rate optimization

        Returns:
            dict with timing breakdown
        """
        # Symbol time
        t_sym = (2 ** sf) / bw_hz  # seconds

        # Preamble time
        t_preamble = (preamble_len + 4.25) * t_sym

        # Payload calculation
        de = 1 if low_data_rate_opt else 0
        ih = 0 if explicit_header else 1
        crc_val = 1 if crc else 0

        # Semtech formula
        numerator = 8 * payload_bytes - 4 * sf + 28 + 16 * crc_val - 20 * ih
        denominator = 4 * (sf - 2 * de)

        n_payload = 8 + max(0, math.ceil(numerator / denominator) * (cr + 4))

        t_payload = n_payload * t_sym

        # Total airtime
        t_air = t_preamble + t_payload

        return {
            'payload_bytes': payload_bytes,
            'sf': sf,
            'bw_hz': bw_hz,
            'bw_khz': bw_hz / 1000,
            'cr': cr,
            't_sym_ms': t_sym * 1000,
            't_preamble_ms': t_preamble * 1000,
            'n_payload_symbols': n_payload,
            't_payload_ms': t_payload * 1000,
            't_air_ms': t_air * 1000,
            't_air_s': t_air
        }

    def calculate_fragments(self, payload_bytes, max_payload_per_packet=222):
        """
        Calculate number of fragments needed

        Args:
            payload_bytes: Total payload size
            max_payload_per_packet: Maximum LoRa payload per packet

        Returns:
            Number of fragments needed
        """
        return math.ceil(payload_bytes / max_payload_per_packet)

    def generate_table3_data(self):
        """Generate data for Table 3"""
        configs = [
            # (payload_bytes, SF, BW_Hz)
            (100, 7, 125000),
            (100, 9, 125000),
            (100, 12, 125000),
            (500, 7, 125000),
            (500, 9, 125000),
            (500, 12, 125000),
            (1000, 7, 125000),
            (1000, 9, 125000),
            (1000, 12, 125000),
            (2000, 7, 125000),
            (2000, 9, 125000),
            (2000, 12, 125000),
        ]

        results = []
        for payload, sf, bw in configs:
            airtime = self.calculate_airtime(payload, sf, bw)
            fragments = self.calculate_fragments(payload)

            results.append({
                'payload_bytes': payload,
                'sf': sf,
                'bw_khz': bw / 1000,
                'airtime_ms': airtime['t_air_ms'],
                'airtime_s': airtime['t_air_s'],
                'fragments': fragments,
                'total_airtime_s': airtime['t_air_s'] * fragments
            })

        return results

    def print_latex_table3(self, results):
        """Generate LaTeX for Table 3"""
        print("% Table 3: LoRa airtime per payload")
        print("\\begin{tabular}{lccc}")
        print("\\toprule")
        print("Payload (B) & SF/BW & Airtime (s) & Fragments \\\\")
        print("\\midrule")

        for r in results:
            sf_bw = f"SF{r['sf']}/{r['bw_khz']:.0f}kHz"
            print(f"{r['payload_bytes']} & {sf_bw} & {r['airtime_s']:.3f} & {r['fragments']} \\\\")

        print("\\bottomrule")
        print("\\end{tabular}")

    def print_csv(self, results):
        """Print results as CSV"""
        print("Payload_B,SF,BW_kHz,Airtime_ms,Airtime_s,Fragments,Total_Airtime_s")
        for r in results:
            print(f"{r['payload_bytes']},{r['sf']},{r['bw_khz']:.0f},"
                  f"{r['airtime_ms']:.2f},{r['airtime_s']:.3f},"
                  f"{r['fragments']},{r['total_airtime_s']:.3f}")


def main():
    parser = argparse.ArgumentParser(
        description='Calculate LoRa airtimes for IEEE paper'
    )
    parser.add_argument(
        '--output', '-o',
        choices=['json', 'csv', 'latex', 'all'],
        default='json',
        help='Output format'
    )
    parser.add_argument(
        '--payload', '-p',
        type=int,
        help='Single payload size to calculate (optional)'
    )
    parser.add_argument(
        '--sf',
        type=int,
        default=7,
        help='Spreading factor (7-12)'
    )
    parser.add_argument(
        '--bw',
        type=int,
        default=125,
        help='Bandwidth in kHz (125, 250, 500)'
    )

    args = parser.parse_args()

    calc = LoRaAirtimeCalculator()

    if args.payload:
        # Single calculation
        result = calc.calculate_airtime(args.payload, args.sf, args.bw * 1000)
        print(json.dumps(result, indent=2))
    else:
        # Generate full table
        results = calc.generate_table3_data()

        if args.output == 'json' or args.output == 'all':
            print(json.dumps(results, indent=2))
            if args.output == 'all':
                print("\n" + "="*60 + "\n")

        if args.output == 'csv' or args.output == 'all':
            calc.print_csv(results)
            if args.output == 'all':
                print("\n" + "="*60 + "\n")

        if args.output == 'latex' or args.output == 'all':
            calc.print_latex_table3(results)


if __name__ == '__main__':
    main()
