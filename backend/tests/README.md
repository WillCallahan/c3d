# C3D Backend Tests

## Test Structure

- **Unit Tests** (`test_app_unit.py`): Fast tests with mocked dependencies
- **Integration Tests** (`test_converter_integration.py`): Tests with partial mocking
- **E2E Tests** (`test_e2e.py`): Tests against real AWS API

## Setup

```bash
cd backend/tests
pip install -r requirements-test.txt
```

## Running Tests

### Run all tests
```bash
pytest
```

### Run only unit tests (fast)
```bash
pytest -m unit
```

### Run only integration tests
```bash
pytest -m integration
```

### Run E2E tests (requires deployed API)
```bash
export API_ENDPOINT=https://cr5cbxhsvd.execute-api.us-east-1.amazonaws.com/Prod
pytest -m e2e
```

### Run with coverage
```bash
pytest --cov=../c3d --cov-report=html
```

### Skip slow tests
```bash
pytest -m "not slow"
```

## E2E Test Notes

E2E tests invoke the real AWS API at:
- Default: `https://cr5cbxhsvd.execute-api.us-east-1.amazonaws.com/Prod`
- Override with `API_ENDPOINT` environment variable

These tests:
- Create real upload URLs
- Upload test files to S3
- Check job status
- Verify CORS headers
- Test error handling
- Measure response times

**Note:** E2E tests may incur small AWS costs (fractions of a cent).
