# c3d: 3D File Conversion Utility

`c3d` is a command-line tool for converting 3D files from one format to another.

## Installation

### From PyPI

```bash
pip install c3d
```

### From source

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/c3d.git
    cd c3d
    ```

2.  **Install in editable mode:**
    ```bash
    pip install -e .
    ```

## Usage

```bash
c3d <input_file> <output_file> [options]
```

### Example

```bash
c3d my_model.step my_model.stl
```

### Options

-   `--lin_deflection`: Linear deflection for meshing (tolerance). Default is `0.001`.
-   `--ang_deflection`: Angular deflection for meshing. Default is `0.1`.

#### Example with options

```bash
c3d my_model.step my_model.stl --lin_deflection 0.01 --ang_deflection 0.2
```
