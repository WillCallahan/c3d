# c3d: Phase II - Cloud-Based Conversion Service Requirements

## 1. Phase II Overview

**Goal:** To extend the `c3d` utility into a cloud-based, serverless web application that allows users to convert 3D files through a simple web interface.

**High-Level Strategy:** This phase will introduce a web front-end and a serverless back-end running on AWS. The project will be structured as a monorepo to manage the front-end and back-end code in a single repository.

## 2. High-Level Architecture

The service will be built on a serverless architecture using AWS services to ensure scalability and cost-effectiveness.

-   **Frontend:** A React/TypeScript single-page application (SPA) hosted on a service like AWS S3 with CloudFront for distribution.
-   **Backend:** An AWS Lambda function containing the core `c3d` conversion logic.
-   **API:** An Amazon API Gateway will provide the RESTful API endpoints to connect the front-end and back-end.
-   **File Storage:** Amazon S3 will be used for storing uploaded source files and the resulting converted files.
-   **Infrastructure as Code (IaC):** The entire infrastructure will be defined and deployed using the AWS Serverless Application Model (SAM).

## 3. Backend Requirements (AWS Lambda)

-   **Runtime:** The Lambda function will use a Python runtime.
-   **Conversion Logic:** The core conversion logic developed in Phase I will be packaged as a Lambda-compatible artifact (e.g., a container image or a Lambda layer with dependencies).
-   **API Endpoints:** The backend will expose the following API endpoints through API Gateway:
    -   `POST /upload-url`: Generates a pre-signed S3 URL for securely uploading a source file.
    -   `POST /convert`: Initiates a conversion job. The request body will include the source file location, target format, etc. This will trigger the conversion Lambda asynchronously.
    -   `GET /status/{job_id}`: Checks the status of a conversion job (e.g., `pending`, `processing`, `completed`, `failed`).
    -   `GET /download-url/{job_id}`: Generates a pre-signed S3 URL for downloading the converted file.
-   **Scalability:** The architecture should handle concurrent conversion jobs.

## 4. Frontend Requirements (React App)

-   **Framework:** The front-end will be a single-page application built with **React** and **TypeScript**.
-   **UI/UX:**
    -   A clean, modern, and responsive user interface.
    -   A file upload area, preferably with drag-and-drop support, for uploading one or more files.
    -   Dropdown menus for selecting the source and target file formats.
    -   A clear "Convert" button to initiate the process.
    -   A status display area to show the progress of each file's conversion.
    -   Download links for the converted files once they are ready.
-   **Best Practices:**
    -   Component-based architecture.
    -   State management using a library like Redux Toolkit or Zustand.
    -   Strict adherence to TypeScript best practices.

## 5. Infrastructure and Deployment (AWS SAM)

-   **SAM Template (`template.yaml`):** The AWS SAM template will define all the necessary AWS resources, including:
    -   `AWS::Serverless::Function` for the Python Lambda function.
    -   `AWS::Serverless::Api` for the API Gateway.
    -   Two `AWS::S3::Bucket` resources: one for uploads and one for converted files.
    -   Appropriate IAM roles and policies to ensure secure access between services.
-   **Deployment:** The application will be deployed using the AWS SAM CLI (`sam build` and `sam deploy`).
-   **CI/CD:** GitHub Actions will be extended to automate the deployment of the SAM application when changes are pushed to the main branch.

## 6. Monetization

-   **Google AdSense:** The React application will integrate Google AdSense to display ads. The ad placement should be unobtrusive and not interfere with the user experience.

## 7. Project Structure (Monorepo)

The project will be organized as a monorepo to streamline development and deployment.

```
c3d/
├── backend/
│   ├── src/
│   │   └── ... (Python Lambda code)
│   ├── template.yaml   (AWS SAM template)
│   └── ...
├── frontend/
│   ├── src/
│   │   └── ... (React/TypeScript components)
│   ├── package.json
│   └── ...
├── .gitignore
├── REQUIREMENTS.md
└── REQUIREMENTS-PHASE-II.md
```
