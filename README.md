# BDD Cucumber Test Report Plugin for Jenkins

A modern, interactive, high-performance, and storage-optimized BDD Cucumber test report generator for Jenkins.

---

## Key Features

- 📊 **Modern Dashboard UI**: Real-time pass/fail/skip metrics, progress distributions, and execution durations with clean Emerald/Rose/Amber color accents.
- 🌙 **Dark & Light Mode**: Built-in theme switcher with CSS custom variables and persistent user preference.
- ⚡ **Controller Storage Optimization**:
  - **On-the-fly GZIP Compression**: Stores test results as `cucumber-report.json.gz` inside `build.getRootDir()`.
  - **Large Attachment Pruning & Fragmenting**: Strips heavy screenshots and text logs exceeding the user threshold into individual disk fragments (`cucumber-attachments/att-*.dat`), preventing controller disk and memory bloat.
  - **Zero-Leak Lazy Loading**: Uses JVM `SoftReference` and direct streaming from `.gz` files so controller heap memory is freed immediately during JVM Garbage Collection.
- 🔍 **Interactive Filtering & Search**:
  - Real-time search across Features, Scenarios, Steps, and Error stack traces.
  - Quick status toggles (**All**, **Failed**, **Passed**, **Skipped**).
  - Dynamic **Tag Filter** pill-box with automatic `@tag` extraction and scenario counts.
- 🌳 **Expandable / Collapsible Tree**:
  - Failed scenarios automatically expand on page load for immediate root cause debugging.
  - Keyword badges (`Given`, `When`, `Then`, `And`, `But`), Gherkin Data Tables, and DocStrings.
  - **Step Duration Bottleneck Warnings**: Steps taking $\ge 5\text{s}$ are highlighted with a subtle amber badge (`⏱️ > 5.0s`).
- 📁 **Debug & Attachments Explorer**:
  - Dedicated file-tree sidebar grouped by **Feature > Scenario > Attachment**.
  - One-click **Copy to Clipboard** with visual toast notifications.
  - Built-in previewer for JSON, XML, server logs, and image screenshots.

---

## Pipeline Configuration (Jenkinsfile)

```groovy
pipeline {
    agent any

    stages {
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
    }

    post {
        always {
            cucumberReport(
                jsonReportPath: '**/target/cucumber*.json',
                embedFullAttachments: false,
                attachmentThresholdKB: 500,
                failBuildOnTestFailure: true,
                ignoreMissingReports: false
            )
        }
    }
}
```

---

## Freestyle Job Setup

1. In your job configuration, scroll down to **Post-build Actions**.
2. Select **"Publish BDD Cucumber Report"**.
3. Configure the file pattern (e.g. `**/cucumber.json`).
4. (Optional) Open **Advanced** to configure attachment thresholding or failure policies.

---

## Build & Run Locally

```bash
# Build plugin HPI package
mvn clean package

# Run interactive Jenkins test instance with plugin installed
mvn hpi:run
```
