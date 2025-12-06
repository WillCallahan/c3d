import argparse
import os
import glob
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


from typing import Callable, Literal, Optional, cast

ExportType = Literal["STL", "STEP", "AMF", "SVG", "TJS", "DXF", "VRML", "VTP", "3MF", "BREP", "BIN"]
def convert_with_cadquery(
    input_file: str,
    output_file: str,
    export_format: ExportType,
    linear_deflection: float,
    angular_deflection: float,
):
    """Converts a file using CadQuery."""
    importer = CADQUERY_IMPORTERS.get(get_file_extension(input_file))
    if not importer:
        raise ValueError(
            f"Unsupported input format for CadQuery: {get_file_extension(input_file)}"
        )

    shape = importer(input_file)
    if shape is None:
        raise ValueError(f"No shape found in {input_file}")

    cq.exporters.export(
        shape,
        output_file,
        exportType=export_format,
        tolerance=linear_deflection,
        angularTolerance=angular_deflection,
    )


def convert_with_trimesh(input_file: str, output_file: str):
    """Converts a file using trimesh."""
    mesh = trimesh.load(input_file)
    mesh.export(output_file)


def convert(
    input_file: str,
    output_file: str,
    linear_deflection: float = 0.001,
    angular_deflection: float = 0.1,
    input_format: Optional[str] = None,
    output_format: Optional[str] = None,
):
    """
    Converts a 3D file from one format to another.
    """
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Input file not found at {input_file}")

    input_ext = f".{input_format}" if input_format else get_file_extension(input_file)
    output_ext = (
        f".{output_format}" if output_format else get_file_extension(output_file)
    )

    if input_ext in MESH_FORMATS and output_ext in MESH_FORMATS:
        print("Converting with trimesh...")
        convert_with_trimesh(input_file, output_file)
    elif input_ext in CADQUERY_IMPORTERS and output_ext in CADQUERY_EXPORTERS:
        print("Converting with CadQuery...")
        export_format = CADQUERY_EXPORTERS[output_ext]
        convert_with_cadquery(
            input_file,
            output_file,
            cast(ExportType, export_format),
            linear_deflection,
            angular_deflection,
        )
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
            import tempfile

            with tempfile.NamedTemporaryFile(suffix=".stl", delete=False) as tmp:
                cq.exporters.export(
                    shape,
                    tmp.name,
                    exportType="STL",
                    tolerance=linear_deflection,
                    angularTolerance=angular_deflection,
                )
                convert_with_trimesh(tmp.name, output_file)
                os.remove(tmp.name)

        else:
            raise ValueError(f"Unsupported conversion from {input_ext} to {output_ext}")

    print(f"Successfully converted {input_file} to {output_file}")


__version__ = "0.1.0"


def main():
    """
    The main entry point for the CLI.
    """
    parser = argparse.ArgumentParser(description="c3d: A 3D file conversion tool.")
    parser.add_argument(
        "input",
        nargs="+",
        help="Path to the input file(s). Glob patterns are supported.",
    )
    parser.add_argument("output", help="Path to the output file or directory.")
    parser.add_argument(
        "--input_format", help="Input file format (e.g., 'step', 'stl')."
    )
    parser.add_argument(
        "--output_format", help="Output file format (e.g., 'step', 'stl')."
    )
    parser.add_argument(
        "--lin_deflection",
        type=float,
        default=0.001,
        help="Linear deflection for meshing (tolerance).",
    )
    parser.add_argument(
        "--ang_deflection",
        type=float,
        default=0.1,
        help="Angular deflection for meshing.",
    )
    parser.add_argument(
        "--version", action="version", version=f"%(prog)s {__version__}"
    )

    args = parser.parse_args()

    # Expand glob patterns
    input_files = []
    for pattern in args.input:
        input_files.extend(glob.glob(pattern))

    if not input_files:
        print("Error: No input files found.")
        import sys

        sys.exit(1)

    output_is_dir = os.path.isdir(args.output) or (
        not os.path.exists(args.output) and get_file_extension(args.output) == ""
    )

    if output_is_dir:
        os.makedirs(args.output, exist_ok=True)

    if len(input_files) > 1 and not output_is_dir:
        print("Error: When converting multiple files, the output must be a directory.")
        import sys

        sys.exit(1)

    for input_file in input_files:
        if output_is_dir:
            base, _ = os.path.splitext(os.path.basename(input_file))
            output_format = args.output_format if args.output_format else "stl"
            output_file = os.path.join(args.output, f"{base}.{output_format}")
        else:
            output_file = args.output

        try:
            convert(
                input_file,
                output_file,
                args.lin_deflection,
                args.ang_deflection,
                args.input_format,
                args.output_format,
            )
        except (FileNotFoundError, ValueError) as e:
            print(f"Error converting {input_file}: {e}")


if __name__ == "__main__":
    main()
