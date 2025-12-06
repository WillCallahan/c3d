# step-to-stl: 3D File Conversion Utility

`step-to-stl` is a command-line tool for converting 3D files from one format to another.

## Project Requirements

The detailed requirements for this project are split into two phases:

-   [Phase I: Command-Line Tool](./docs/REQUIREMENTS-PHASE-I.md)
-   [Phase II: Cloud-Based Service](./docs/REQUIREMENTS-PHASE-II.md)

## Installation

### From PyPI

```bash
pip install step-to-stl
```

### From Homebrew (macOS)

```bash
brew install <YOUR-USERNAME>/step-to-stl/step-to-stl
```

### From Winget (Windows)

```bash
winget install YourName.step-to-stl
```

### From source

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/<YOUR-USERNAME>/step-to-stl.git
    cd step-to-stl
    ```

2.  **Install in editable mode:**
    ```bash
    pip install -e .
    ```

## Usage

```bash
c3d <input_file(s)> <output_directory> [options]
```

### Example

Convert a single file:
```bash
c3d my_model.step my_model.stl
```

Convert multiple files using a glob pattern:
```bash
c3d "models/*.step" output_directory/
```

### Options

-   `--lin_deflection`: Linear deflection for meshing (tolerance). Default is `0.001`.
-   `--ang_deflection`: Angular deflection for meshing. Default is `0.1`.

#### Example with options

```bash
c3d my_model.step my_model.stl --lin_deflection 0.01 --ang_deflection 0.2
```

## Distribution

This project is set up for automated releases to PyPI, Homebrew, and Winget.

### PyPI

Publishing to PyPI is automated via the `release.yaml` GitHub Actions workflow. This workflow triggers when a new tag is pushed to the repository.

### Homebrew

The Homebrew formula is located at `dist/c3d.rb`. To make this work, you need to:

1.  Create a new public GitHub repository named `homebrew-c3d`.
2.  Create a `Formula` directory inside this repository.
3.  Copy the `dist/c3d.rb` file to the `Formula` directory in your `homebrew-c3d` repository.
4.  Update the `url` and `sha256` fields in the formula with the correct values from your GitHub release.

### Winget

The Winget manifest is located at `dist/c3d.yaml`. To publish to Winget, you need to:

1.  Fork the [microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs) repository.
2.  Create a new directory structure in your fork under the `manifests` directory: `manifests/y/YourName/c3d/0.1.0`.
3.  Copy the `dist/c3d.yaml` file into this new directory.
4.  Update the `InstallerUrl` and `InstallerSha256` fields with the correct values from your GitHub release.
5.  Create a pull request to the `microsoft/winget-pkgs` repository.