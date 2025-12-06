#!/usr/bin/env python3

import argparse
import os
import sys
import cadquery as cq

def create_test_step_file(filename="test.step"):
    """Creates a simple STEP file for testing."""
    # Create a simple box and export it to a STEP file
    result = cq.Workplane("XY").box(1, 2, 3)
    cq.exporters.export(result, filename)
    print(f"Created test STEP file: {filename}")

def convert_step_to_stl(step_file, stl_file, linear_deflection=0.001, angular_deflection=0.1):
    """
    Converts a STEP file to an STL file.

    :param step_file: Path to the input STEP file.
    :param stl_file: Path to the output STL file.
    :param linear_deflection: Linear deflection for meshing.
    :param angular_deflection: Angular deflection for meshing.
    """
    if not os.path.exists(step_file):
        print(f"Error: Input file not found at {step_file}")
        sys.exit(1)

    # Load the STEP file
    try:
        shape = cq.importers.importStep(step_file)
    except Exception as e:
        print(f"Error: Could not read STEP file: {step_file}")
        print(e)
        sys.exit(1)

    if shape is None:
        print("Error: No shape found in STEP file.")
        sys.exit(1)

    # Export to STL
    try:
        cq.exporters.export(shape, stl_file, tolerance=linear_deflection, angularTolerance=angular_deflection)
    except Exception as e:
        print(f"Error: Could not write STL file: {stl_file}")
        print(e)
        sys.exit(1)

    print(f"Successfully converted {step_file} to {stl_file}")


def main():
    parser = argparse.ArgumentParser(description="Convert STEP files to STL files.")
    parser.add_argument("input", nargs='?', default=None, help="Path to the input STEP file.")
    parser.add_argument("output", nargs='?', default=None, help="Path to the output STL file.")
    parser.add_argument("--lin_deflection", type=float, default=0.001, help="Linear deflection for meshing (tolerance).")
    parser.add_argument("--ang_deflection", type=float, default=0.1, help="Angular deflection for meshing.")
    parser.add_argument("--test", action="store_true", help="Run a test conversion with a generated STEP file.")

    args = parser.parse_args()

    if args.test:
        test_step_file = "test.step"
        test_stl_file = "test.stl"
        create_test_step_file(test_step_file)
        convert_step_to_stl(test_step_file, test_stl_file)
        # Clean up the test files
        os.remove(test_step_file)
        os.remove(test_stl_file)
        print("Test complete.")
        sys.exit(0)

    if not args.input or not args.output:
        parser.print_help()
        sys.exit(1)

    convert_step_to_stl(args.input, args.output, args.lin_deflection, args.ang_deflection)


if __name__ == "__main__":
    main()