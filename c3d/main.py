import argparse
import os
import sys
import cadquery as cq

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
    parser = argparse.ArgumentParser(description="c3d: A 3D file conversion tool.")
    parser.add_argument("input", help="Path to the input file.")
    parser.add_argument("output", help="Path to the output file.")
    parser.add_argument("--lin_deflection", type=float, default=0.001, help="Linear deflection for meshing (tolerance).")
    parser.add_argument("--ang_deflection", type=float, default=0.1, help="Angular deflection for meshing.")

    args = parser.parse_args()

    # For now, we only support step to stl
    # In the future, we will use the file extensions to determine the conversion
    if not args.input.lower().endswith((".step", ".stp")):
        print("Error: Input file must be a STEP file (.step or .stp).")
        sys.exit(1)
    
    if not args.output.lower().endswith(".stl"):
        print("Error: Output file must be an STL file (.stl).")
        sys.exit(1)

    convert_step_to_stl(args.input, args.output, args.lin_deflection, args.ang_deflection)


if __name__ == "__main__":
    main()
