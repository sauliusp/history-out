# HistoryOut - Chrome Extension

HistoryOut is a Chrome extension that allows users to export and analyze their browsing history with custom date ranges. Download your history in CSV, JSON, or HTML formats with configurable fields and time ranges.

## Features

- Export browsing history in multiple formats (CSV, JSON, HTML)
- Custom date range selection
- Configurable output fields
- Side panel integration for easy access
- Responsive Material UI design
- Persistent settings across sessions

## Development Setup

### Prerequisites

- Node.js (LTS version recommended)
- npm (comes with Node.js)
- Chrome browser

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development Commands

- Start development mode with hot reload:

  ```bash
  npm run dev
  ```

- Create a production-ready version of the extension:

  ```bash
  npm run build
  ```

- Create distribution package:
  ```bash
  npm run pack
  ```

### Project Structure

The extension uses a two-directory approach:

- `src/`: Source code files
- `extension-unpacked/`: Build output directory containing the extension files

The `extension-unpacked` directory is required by Chrome's extension system and contains:

- Manifest file
- Compiled bundle
- Static assets (HTML, icons)
- Service worker

### Loading the Extension in Chrome

1. Build the extension:
   ```bash
   npm run build
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `extension-unpacked` directory

## Configuration

The extension supports various configuration options through the UI:

- **Time Ranges**: Last 24 hours, Last 7 days, Last 30 days, All Time, or Custom Range
- **Export Formats**: CSV, JSON, HTML
- **Configurable Fields**:
  - Order
  - ID
  - Date
  - Time
  - Title
  - URL
  - Visit Count
  - Typed Count
  - Transition Type

## Technical Details

- Built with React and TypeScript
- Uses Material-UI (MUI) for components
- Implements Chrome's Side Panel API
- Uses Webpack for bundling
- Follows Chrome's Manifest V3 specificationss

## Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the Repository**

   - Create a personal fork of the project
   - Clone your fork locally

2. **Set Up Development Environment**

   ```bash
   npm install
   npm run dev
   ```

3. **Create a Branch**

   - Branch from `main` using a descriptive name
   - Example: `feature/add-new-export-format` or `fix/date-picker-validation`

4. **Submit a Pull Request**
   - Push changes to your fork
   - Open a PR against the `main` branch
   - Include a clear description of the changes
   - Reference any related issues

### Development Guidelines

- Follow TypeScript best practices and maintain strict type safety
- Use the established MUI component patterns
- Keep bundle size in mind when adding dependencies
