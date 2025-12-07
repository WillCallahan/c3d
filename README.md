# c3d: The Universal 3D File Converter

`c3d` (Convert 3D) is a powerful and versatile cloud-based platform designed for seamless conversion of various 3D file formats. Our service allows users to easily convert between popular formats like STEP, STL, OBJ, and 3MF, providing a smooth experience for engineers, designers, and hobbyists.

## Features

*   **Broad Format Support**: Convert between a wide range of 3D file types including, but not limited to, STEP, STL, OBJ, and 3MF.
*   **Intuitive Web Interface**: Drag-and-drop multiple files for instant conversion.
*   **Automatic Format Detection**: Smartly infers source file formats from file extensions.
*   **Real-time Progress Monitoring**: Track the status of each conversion with live updates and progress bars.
*   **Secure & Scalable Cloud Backend**: Leverage a robust AWS-powered backend for fast and reliable conversions, ensuring data security.
*   **Light & Dark Mode**: A modern and visually appealing user interface with theme toggling.
*   **SEO Optimized**: Designed for discoverability and semantic friendliness.

## Supported Formats

### Input Formats

*   STEP (.step, .stp)
*   STL (.stl)
*   OBJ (.obj)
*   3MF (.3mf)
*   IGES (.iges, .igs) - *Note: IGES files are converted to an intermediate format (like STEP or STL) before final conversion to the target format.*

### Output Formats

*   STEP (.step, .stp)
*   STL (.stl)
*   OBJ (.obj)
*   3MF (.3mf)

## Getting Started (Web Application)

To run the `c3d` web application locally:

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or yarn
*   Python 3.9+
*   Poetry (for Python dependency management)
*   AWS CLI configured with credentials to deploy resources

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or yarn install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    # or yarn dev
    ```
    The frontend will be available at `http://localhost:5173`.

### Backend Setup (AWS Serverless)

The backend is an AWS Serverless application. You will need to deploy it to your AWS account.

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install Python dependencies using Poetry:
    ```bash
    poetry install
    ```
3.  Build the Serverless application:
    ```bash
    sam build
    ```
4.  Deploy the application to AWS:
    ```bash
    sam deploy --guided
    ```
    Follow the prompts to configure your deployment. This will create S3 buckets and API Gateway endpoints. Note down the API Gateway endpoint URL.

### Connecting Frontend to Backend

After deploying the backend, update the `axios` base URL in the frontend to point to your deployed API Gateway endpoint. This usually involves setting up environment variables in your frontend project (e.g., in a `.env` file).

## Project Structure

*   `frontend/`: Contains the React web application.
*   `backend/`: Contains the AWS Serverless application (Python Lambda functions).
*   `docs/`: Project documentation and requirements.

## Contribution

We welcome contributions! Please see our `CONTRIBUTING.md` for more details.

## License

This project is licensed under the MIT License.
