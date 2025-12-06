import argparse
import os
import sys
from typing import Callable
import cadquery as cq
import trimesh

# A dictionary mapping file extensions to their importer functions
CADQUERY_IMPORTERS: dict[str, Callable] = {
    ".step": cq.importers.importStep,
    ".stp": cq.importers.importStep,
}

# A dictionary mapping file extensions to their exporter functions
# The value is the 'exportType' parameter for cq.exporters.export
CADQUERY_EXPORTERS: dict[str, str] = {
    ".stl": "STL",
    ".step": "STEP",
    ".stp": "STEP",
    ".3mf": "3MF",
}

MESH_FORMATS = [".obj", ".stl", ".3mf"]

def get_file_extension(filename: str) -> str:
    """Returns the file extension in lowercase."""
    return os.path.splitext(filename)[1].lower()


def convert_with_cadquery(input_file: str, output_file: str, export_format: str, linear_deflection: float, angular_deflection: float):
    """Converts a file using CadQuery."""
    importer = CADQUERY_IMPORTERS.get(get_file_extension(input_file))
    if not importer:
        raise ValueError(f"Unsupported input format for CadQuery: {get_file_extension(input_file)}")

    shape = importer(input_file)
    if shape is None:
        raise ValueError(f"No shape found in {input_file}")

    cq.exporters.export(shape, output_file, exportType=export_format, tolerance=linear_deflection, angularTolerance=angular_deflection)

def convert_with_trimesh(input_file: str, output_file: str):
    """Converts a file using trimesh."""
    mesh = trimesh.load(input_file)
    mesh.export(output_file)


def convert(input_file: str, output_file: str, linear_deflection: float = 0.001, angular_deflection: float = 0.1):
    """
    Converts a 3D file from one format to another.
    """
    if not os.path.exists(input_file):
        print(f"Error: Input file not found at {input_file}")
        sys.exit(1)

    input_ext = get_file_extension(input_file)
    output_ext = get_file_extension(output_file)

    try:
        if input_ext in MESH_FORMATS and output_ext in MESH_FORMATS:
            print("Converting with trimesh...")
            convert_with_trimesh(input_file, output_file)
        elif input_ext in CADQUERY_IMPORTERS and output_ext in CADQUERY_EXPORTERS:
            print("Converting with CadQuery...")
            export_format = CADQUERY_EXPORTERS[output_ext]
            convert_with_cadquery(input_file, output_file, export_format, linear_deflection, angular_deflection)
        else:
            # Fallback for conversions between cadquery and trimesh
            if input_ext in CADQUERY_IMPORTERS and output_ext in MESH_FORMATS:
                print("Converting from CAD to mesh...")
                # CadQuery to Trimesh
                importer = CADQUERY_IMPORTERS[input_ext]
                shape = importer(input_file)
                if shape is None:
                    raise ValueError(f"No shape found in {input_file}")
                
                # Using an intermediate STL file for conversion
                # This is not ideal, but it's a simple way to bridge the two libraries
                import tempfile
                with tempfile.NamedTemporaryFile(suffix=".stl", delete=False) as tmp:
                    cq.exporters.export(shape, tmp.name, exportType="STL", tolerance=linear_deflection, angularTolerance=angular_deflection)
                    convert_with_trimesh(tmp.name, output_file)
                    os.remove(tmp.name)

            else:
                print(f"Error: Unsupported conversion from {input_ext} to {output_ext}")
                sys.exit(1)
        
        print(f"Successfully converted {input_file} to {output_file}")

    except Exception as e:
        print(f"An error occurred during conversion: {e}")
        sys.exit(1)


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