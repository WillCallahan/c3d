import argparse
import os
import sys
from typing import Callable
import cadquery as cq
from cqkit import import_iges_file

# A dictionary mapping file extensions to their importer functions
IMPORTERS: dict[str, Callable] = {
    ".step": cq.importers.importStep,
    ".stp": cq.importers.importStep,
    ".iges": import_iges_file,
    ".igs": import_iges_file,
}

# A dictionary mapping file extensions to their exporter functions
EXPORTERS: dict[str, Callable] = {
    ".stl": cq.exporters.export,
    # Add other exporters here as they are implemented
}


def get_file_extension(filename: str) -> str:
    """Returns the file extension in lowercase."""
    return os.path.splitext(filename)[1].lower()


def convert(input_file: str, output_file: str, linear_deflection: float = 0.001, angular_deflection: float = 0.1):
    """
    Converts a 3D file from one format to another.

    :param input_file: Path to the input file.
    :param output_file: Path to the output file.
    :param linear_deflection: Linear deflection for meshing.
    :param angular_deflection: Angular deflection for meshing.
    """
    if not os.path.exists(input_file):
        print(f"Error: Input file not found at {input_file}")
        sys.exit(1)

    input_ext = get_file_extension(input_file)
    output_ext = get_file_extension(output_file)

    importer = IMPORTERS.get(input_ext)
    if not importer:
        print(f"Error: Unsupported input file format: {input_ext}")
        print(f"Supported formats are: {list(IMPORTERS.keys())}")
        sys.exit(1)

    exporter = EXPORTERS.get(output_ext)
    if not exporter:
        print(f"Error: Unsupported output file format: {output_ext}")
        print(f"Supported formats are: {list(EXPORTERS.keys())}")
        sys.exit(1)

    # Load the shape
    try:
        shape = importer(input_file)
    except Exception as e:
        print(f"Error: Could not read input file: {input_file}")
        print(e)
        sys.exit(1)

    if shape is None:
        print(f"Error: No shape found in {input_file}.")
        sys.exit(1)

    # Export the shape
    try:
        # The exporter API is not consistent, some exporters need more arguments
        if output_ext == ".stl":
            exporter(shape, output_file, tolerance=linear_deflection, angularTolerance=angular_deflection)
        else:
            exporter(shape, output_file)

    except Exception as e:
        print(f"Error: Could not write output file: {output_file}")
        print(e)
        sys.exit(1)

    print(f"Successfully converted {input_file} to {output_file}")


def main():
    parser = argparse.ArgumentParser(description="c3d: A 3D file conversion tool.")
    parser.add_argument("input", help="Path to the input file.")
    parser.add_argument("output", help="Path to the output file.")
    parser.add_argument("--lin_deflection", type=float, default=0.001, help="Linear deflection for meshing (tolerance).")
    parser.add_argument("--ang_deflection", type=float, default=0.1, help="Angular deflection for meshing.")

    args = parser.parse_args()

    convert(args.input, args.output, args.lin_deflection, args.ang_deflection)


if __name__ == "__main__":
    main()
