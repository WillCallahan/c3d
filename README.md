# STEP to STL Converter

This project provides a command-line tool to convert STEP files to STL files.

## Prerequisites

- Python 3
- pip

## Setup

1. **Create a virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Make the script executable:
```bash
chmod +x step_to_stl.py
```

Run the script from the command line, providing the input STEP file and the desired output STL file path.

```bash
./step_to_stl.py [INPUT_STEP_FILE] [OUTPUT_STL_FILE]
```

### Example

```bash
./step_to_stl.py my_model.step my_model.stl
```

### Options

You can also adjust the meshing parameters for the STL export:

- `--lin_deflection`: Linear deflection for meshing (tolerance). Default is `0.001`.
- `--ang_deflection`: Angular deflection for meshing. Default is `0.1`.

#### Example with options

```bash
./step_to_stl.py my_model.step my_model.stl --lin_deflection 0.01 --ang_deflection 0.2
```