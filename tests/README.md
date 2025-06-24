# Tests Directory

This directory contains all testing-related files for the Learn2Play project.

## Directory Structure

```
tests/
├── results/          # Test result files and logs
│   ├── test_results*.json  # JSON test result reports
│   └── test_results*.log   # Test execution logs
└── scripts/          # Test scripts and utilities
    ├── debug_api.cjs           # API debugging utility
    ├── test_all_lobby_features.cjs  # Comprehensive lobby testing
    ├── test_frontend_ui.cjs         # Frontend UI testing
    ├── test_lobby_creation.cjs      # Lobby creation testing
    ├── test_question_sets.cjs       # Question sets testing
    ├── test_runner.cjs              # Main test runner
    ├── test_scoring_system.cjs      # Scoring system testing
    └── test_scoring_system_simple.cjs  # Simplified scoring tests
```

## Test Results

The `results/` directory contains:
- **JSON files**: Detailed test reports with timestamps
- **Log files**: Execution logs and debugging information

## Test Scripts

The `scripts/` directory contains:
- **Test runners**: Main test execution scripts
- **Feature tests**: Specific functionality testing
- **Debug utilities**: API debugging and development tools

## Running Tests

From the project root, you can run tests using:
```bash
node tests/scripts/test_runner.cjs
```

For specific test suites:
```bash
node tests/scripts/test_lobby_creation.cjs
node tests/scripts/test_scoring_system.cjs
# etc.
```

## Notes

- All test result files are automatically timestamped
- Test logs are preserved for debugging purposes
- Scripts maintain executable permissions where needed 