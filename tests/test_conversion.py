import os
import pytest
from c3d.main import convert_step_to_stl
import cadquery as cq

@pytest.fixture
def test_files():
    """A fixture to create and clean up test files."""
    step_file = "test_input.step"
    stl_file = "test_output.stl"
    
    # Create a simple STEP file for testing
    cq.Workplane("XY").box(1, 2, 3).val().exportStep(step_file)
    
    yield step_file, stl_file
    
    # Clean up the files
    if os.path.exists(step_file):
        os.remove(step_file)
    if os.path.exists(stl_file):
        os.remove(stl_file)

def test_convert_step_to_stl(test_files):
    """Test the convert_step_to_stl function."""
    step_file, stl_file = test_files
    convert_step_to_stl(step_file, stl_file)
    assert os.path.exists(stl_file)
    # Check if the STL file is not empty
    assert os.path.getsize(stl_file) > 0

def test_non_existent_input_file():
    """Test the script with a non-existent input file."""
    with pytest.raises(SystemExit) as e:
        convert_step_to_stl("non_existent_file.step", "output.stl")
    assert e.type == SystemExit
    assert e.value.code == 1
