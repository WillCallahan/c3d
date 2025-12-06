import os
import pytest
from c3d.main import convert
import cadquery as cq

@pytest.fixture
def step_file():
    """Creates a temporary STEP file for testing."""
    file_path = "test.step"
    cq.exporters.export(cq.Workplane("XY").box(1, 2, 3), file_path)
    yield file_path
    os.remove(file_path)

@pytest.fixture
def iges_file():
    """Creates a temporary IGES file for testing."""
    file_path = "test.iges"
    cq.exporters.export(cq.Workplane("XY").box(1, 2, 3), file_path)
    yield file_path
    os.remove(file_path)

@pytest.mark.parametrize("input_file_fixture, output_ext", [
    ("step_file", ".stl"),
    ("iges_file", ".stl"),
])
def test_conversion(input_file_fixture, output_ext, request):
    """Test file conversion for different formats."""
    input_file = request.getfixturevalue(input_file_fixture)
    output_file = f"test_output{output_ext}"
    
    convert(input_file, output_file)
    
    assert os.path.exists(output_file)
    assert os.path.getsize(output_file) > 0
    os.remove(output_file)

def test_unsupported_input_format():
    """Test with an unsupported input file format."""
    with pytest.raises(SystemExit) as e:
        convert("test.txt", "output.stl")
    assert e.type == SystemExit
    assert e.value.code == 1

def test_unsupported_output_format(step_file):
    """Test with an unsupported output file format."""
    with pytest.raises(SystemExit) as e:
        convert(step_file, "output.txt")
    assert e.type == SystemExit
    assert e.value.code == 1

def test_non_existent_input_file():
    """Test with a non-existent input file."""
    with pytest.raises(SystemExit) as e:
        convert("non_existent_file.step", "output.stl")
    assert e.type == SystemExit
    assert e.value.code == 1