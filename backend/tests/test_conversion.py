import os
import pytest
import tempfile
import shutil
from backend.c3d.main import convert, main


@pytest.mark.parametrize(
    "input_file, output_ext",
    [
        ("backend/tests/test_assets/sample.step", ".stl"),
        ("backend/tests/test_assets/sample.obj", ".stl"),
        ("backend/tests/test_assets/sample.3mf", ".stl"),
        ("backend/tests/test_assets/sample.step", ".obj"),
        ("backend/tests/test_assets/sample.step", ".3mf"),
    ],
)
def test_conversion(input_file, output_ext):
    """Test file conversion for different formats."""
    output_file = f"test_output{output_ext}"

    convert(input_file, output_file)

    assert os.path.exists(output_file)
    assert os.path.getsize(output_file) > 0
    os.remove(output_file)


def test_unsupported_input_format():
    """Test with an unsupported input file format."""
    with open("dummy.txt", "w") as f:
        f.write("dummy")

    with pytest.raises(ValueError):
        convert("dummy.txt", "output.stl")

    os.remove("dummy.txt")


def test_unsupported_output_format():
    """Test with an unsupported output file format."""
    # Create a dummy file to pass the existence check
    with open("dummy.step", "w") as f:
        f.write("dummy")

    with pytest.raises(ValueError):
        convert("dummy.step", "output.unsupported")

    os.remove("dummy.step")


def test_non_existent_input_file():
    """Test with a non-existent input file."""
    with pytest.raises(FileNotFoundError):
        convert("non_existent_file.step", "output.stl")

def test_conversion_with_glob(monkeypatch):
    """Test file conversion with glob patterns."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create dummy input files
        input_dir = os.path.join(tmpdir, "input")
        os.makedirs(input_dir)
        for i in range(3):
            shutil.copy("backend/tests/test_assets/sample.step", os.path.join(input_dir, f"test{i}.step"))

        # Create output directory
        output_dir = os.path.join(tmpdir, "output")
        os.makedirs(output_dir)

        # Call main with glob pattern
        monkeypatch.setattr("sys.argv", ["c3d", os.path.join(input_dir, "*.step"), output_dir])
        main()

        # Check that the output files were created
        for i in range(3):
            assert os.path.exists(os.path.join(output_dir, f"test{i}.stl"))
