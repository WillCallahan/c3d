import os
import pytest
from c3d.main import convert

@pytest.mark.parametrize("input_file, output_ext", [
    ("tests/test_assets/sample.step", ".stl"),
    ("tests/test_assets/sample.obj", ".stl"),
    ("tests/test_assets/sample.3mf", ".stl"),
    ("tests/test_assets/sample.step", ".obj"),
    ("tests/test_assets/sample.step", ".3mf"),
])
def test_conversion(input_file, output_ext):
    """Test file conversion for different formats."""
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

def test_unsupported_output_format():
    """Test with an unsupported output file format."""
    # Create a dummy file to pass the existence check
    with open("dummy.step", "w") as f:
        f.write("dummy")
    
    with pytest.raises(SystemExit) as e:
        convert("dummy.step", "output.unsupported")
        
    os.remove("dummy.step")
    assert e.type == SystemExit
    assert e.value.code == 1

def test_non_existent_input_file():
    """Test with a non-existent input file."""
    with pytest.raises(SystemExit) as e:
        convert("non_existent_file.step", "output.stl")
    assert e.type == SystemExit
    assert e.value.code == 1
