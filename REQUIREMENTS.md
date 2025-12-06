# c3d: 3D File Conversion Utility - Project Requirements

## 1. Project Overview

**Project Name:** `c3d` (short for "Convert 3D")

**Purpose:** A command-line utility for converting 3D files from one format to another. The project will be production-ready, following Python best practices, and distributed as a package for easy installation on multiple platforms.

**Target Audience:** Engineers, designers, 3D printing enthusiasts, and developers who need a simple and reliable tool for 3D file format conversion.

## 2. Core Features

-   **File Conversion:** The primary feature is to convert 3D models from a source format to a target format.
-   **Extensibility:** The architecture should be modular to allow for the addition of new file formats in the future.
-   **Performance:** The tool should be performant, leveraging efficient libraries for 3D model processing.
-   **User-Friendly CLI:** A simple and intuitive command-line interface.

## 3. Supported File Formats

The initial version of `c3d` must support conversion between the following formats. The list can be expanded in the future.

-   **STEP (.step, .stp):** A widely used format for 3D CAD data.
-   **STL (.stl):** A standard format for 3D printing.
-   **IGES (.iges, .igs):** Another common format for CAD data exchange.
-   **OBJ (.obj):** A popular format for 3D graphics.
-   **3MF (.3mf):** A modern format for 3D printing.

## 4. Command-Line Interface (CLI)

The CLI should be simple and follow common conventions.

**Basic Usage:**
```bash
c3d convert <input_file> <output_file>
```

**Options:**
-   `--input-format`: Explicitly specify the input format (e.g., `step`). If not provided, it should be inferred from the file extension.
-   `--output-format`: Explicitly specify the output format (e.g., `stl`). If not provided, it should be inferred from the file extension.
-   `--version`: Display the version of the tool.
-   `--help`: Display the help message.

**Example:**
```bash
c3d convert my_model.step my_model.stl
```

## 5. Code Quality and Standards

-   **Style Guide:** All Python code must adhere to the [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide.
-   **Code Formatting:** Use a deterministic code formatter like `black` or `ruff format` to ensure consistent code style.
-   **Linting:** Use a linter like `ruff` or `pylint` to identify and fix code quality issues.
-   **Static Typing:** All code should have type hints and be checked with `mypy`.
-   **Pre-commit Hooks:** Use `pre-commit` to automate code formatting, linting, and type checking before each commit.

## 6. Testing

-   **Test Framework:** Use `pytest` for writing and running tests.
-   **Test Suite:** The project must have a comprehensive test suite, including:
    -   **Unit Tests:** For individual functions and classes.
    -   **Integration Tests:** For the end-to-end conversion process.
-   **Test Coverage:** Aim for a high test coverage percentage (e.g., >90%). Use `coverage.py` to measure test coverage.
-   **Test Data:** A dedicated directory for test files, including sample 3D models in various formats.

## 7. Packaging and Distribution

-   **PyPI:** The project will be packaged and published to the Python Package Index (PyPI).
    -   The package name will be `c3d`.
    -   Packaging will be configured in `pyproject.toml`.
-   **Standalone Executable:** Create a standalone executable for Windows, macOS, and Linux using a tool like `PyInstaller` or `cx_Freeze`. This will be the basis for the Brew and Winget packages.
-   **Homebrew (macOS):** A Homebrew formula will be created to allow installation via `brew install c3d`.
-   **Winget (Windows):** A Winget manifest will be created to allow installation via `winget install c3d`.

## 8. Automation and CI/CD

-   **Source Control:** The project will be hosted on GitHub.
-   **GitHub Actions:** Use GitHub Actions for continuous integration and deployment.
    -   **On every push/pull request:**
        -   Run the test suite.
        -   Run the linter and type checker.
        -   Check code formatting.
    -   **On creating a new tag (e.g., `v1.0.0`):**
        -   Build the standalone executables for all target platforms.
        -   Publish the package to PyPI.
        -   Create a new GitHub Release with the executables as assets.
        -   Update the Homebrew formula.
        -   Update the Winget manifest.

## 9. Licensing

-   The project will be released under an open-source license, such as **MIT** or **Apache 2.0**.
-   A `LICENSE` file must be included in the root of the project repository.
