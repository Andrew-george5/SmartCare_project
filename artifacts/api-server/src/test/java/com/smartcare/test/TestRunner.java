package com.smartcare.test;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;

/**
 * COMPREHENSIVE TEST RUNNER FOR SmartCare API
 * 
 * This test runner:
 * 1. Discovers all test files in the current directory
 * 2. Executes Maven tests programmatically
 * 3. Logs detailed results for each test file
 * 4. Generates comprehensive reports
 * 5. Tracks pass/fail statistics
 * 
 * Features:
 * - Color-coded console output
 * - Detailed logging for each test
 * - Summary statistics
 * - Error tracking and reporting
 * - Execution time tracking
 * - XML and text report generation
 * 
 * @author Software Engineering Team
 * @version 1.0
 */
public class TestRunner {

    private static final String TEST_RESULTS_DIR = "test-results";
    private static final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter fileFormatter = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    
    // ANSI Color codes
    private static final String RESET = "\u001B[0m";
    private static final String BLACK = "\u001B[30m";
    private static final String RED = "\u001B[31m";
    private static final String GREEN = "\u001B[32m";
    private static final String YELLOW = "\u001B[33m";
    private static final String BLUE = "\u001B[34m";
    private static final String CYAN = "\u001B[36m";
    private static final String WHITE = "\u001B[37m";
    private static final String BOLD = "\u001B[1m";

    private static PrintWriter logWriter;
    private static PrintWriter reportWriter;
    private static TestStatistics statistics;

    /**
     * Inner class to track test statistics
     */
    private static class TestStatistics {
        int totalTests = 0;
        int passedTests = 0;
        int failedTests = 0;
        int skippedTests = 0;
        long totalExecutionTime = 0;
        List<TestFileResult> fileResults = new ArrayList<>();

        void addFileResult(TestFileResult result) {
            fileResults.add(result);
            totalTests += result.testCount;
            passedTests += result.passedCount;
            failedTests += result.failedCount;
            skippedTests += result.skippedCount;
            totalExecutionTime += result.executionTime;
        }

        void printSummary() {
            System.out.println("\n" + BOLD + CYAN + "═".repeat(80) + RESET);
            System.out.println(BOLD + CYAN + "                     TEST EXECUTION SUMMARY" + RESET);
            System.out.println(BOLD + CYAN + "═".repeat(80) + RESET);
            System.out.println(BOLD + "Total Tests:" + RESET + " " + totalTests);
            System.out.println(BOLD + GREEN + "✓ Passed:" + RESET + " " + passedTests);
            System.out.println(BOLD + RED + "✗ Failed:" + RESET + " " + failedTests);
            System.out.println(BOLD + YELLOW + "⊘ Skipped:" + RESET + " " + skippedTests);
            System.out.println(BOLD + "Total Execution Time:" + RESET + " " + totalExecutionTime + "ms");
            
            double successRate = totalTests > 0 ? (passedTests * 100.0 / totalTests) : 0;
            String successColor = successRate >= 80 ? GREEN : (successRate >= 50 ? YELLOW : RED);
            System.out.println(BOLD + "Success Rate:" + RESET + " " + successColor + String.format("%.2f%%", successRate) + RESET);
            System.out.println(BOLD + CYAN + "═".repeat(80) + RESET + "\n");
        }
    }

    /**
     * Inner class to store individual test file results
     */
    private static class TestFileResult {
        String fileName;
        String testClassName;
        int testCount;
        int passedCount;
        int failedCount;
        int skippedCount;
        long executionTime;
        List<String> errors;
        boolean passed;

        TestFileResult(String fileName) {
            this.fileName = fileName;
            this.testClassName = fileName.replace(".java", "");
            this.errors = new ArrayList<>();
        }

        void print() {
            String status = passed ? (GREEN + "✓ PASS" + RESET) : (RED + "✗ FAIL" + RESET);
            System.out.printf("%s | Tests: %d | Passed: %d | Failed: %d | Time: %dms%n",
                    status, testCount, passedCount, failedCount, executionTime);
            
            if (!errors.isEmpty()) {
                System.out.println(BOLD + RED + "  Errors:" + RESET);
                errors.forEach(error -> System.out.println("    - " + error));
            }
        }
    }

    public static void main(String[] args) {
        try {
            initialization();
            discoverAndRunTests();
            generateReports();
            cleanup();
        } catch (Exception e) {
            System.err.println(RED + "FATAL ERROR:" + RESET + " " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Initialize test runner
     */
    private static void initialization() throws IOException {
        // Create test results directory
        Files.createDirectories(Paths.get(TEST_RESULTS_DIR));

        // Setup log writers
        String timestamp = LocalDateTime.now().format(fileFormatter);
        String logFilePath = TEST_RESULTS_DIR + "/test-results_" + timestamp + ".log";
        String reportFilePath = TEST_RESULTS_DIR + "/test-report_" + timestamp + ".txt";

        logWriter = new PrintWriter(new FileWriter(logFilePath), true);
        reportWriter = new PrintWriter(new FileWriter(reportFilePath), true);
        statistics = new TestStatistics();

        // Print header
        printHeader();
        log("Test Execution Started: " + LocalDateTime.now().format(dateFormatter));
    }

    /**
     * Print test runner header
     */
    private static void printHeader() {
        System.out.println(BOLD + CYAN);
        System.out.println("╔" + "═".repeat(78) + "╗");
        System.out.println("║" + " ".repeat(20) + "SMARTCARE API - COMPREHENSIVE TEST RUNNER" + " ".repeat(18) + "║");
        System.out.println("║" + " ".repeat(25) + "Following Software Testing Principles" + " ".repeat(16) + "║");
        System.out.println("╚" + "═".repeat(78) + "╝");
        System.out.println(RESET);
    }

    /**
     * Discover and run all test files
     */
    private static void discoverAndRunTests() throws IOException {
        System.out.println(BOLD + CYAN + "\n[1] DISCOVERING TEST FILES..." + RESET);
        log("Discovering test files...");

        File currentDir = new File(".");
        File[] testFiles = currentDir.listFiles((dir, name) -> 
            name.endsWith("Test.java") || name.endsWith("Tests.java"));

        if (testFiles == null || testFiles.length == 0) {
            System.out.println(YELLOW + "⚠ No test files found in current directory" + RESET);
            log("No test files found");
            return;
        }

        System.out.println(GREEN + "✓ Found " + testFiles.length + " test file(s)" + RESET);
        log("Found " + testFiles.length + " test files");

        System.out.println(BOLD + CYAN + "\n[2] EXECUTING TESTS..." + RESET);
        log("\nExecuting tests...");

        for (File testFile : testFiles) {
            executeTest(testFile);
        }
    }

    /**
     * Execute a single test file
     */
    private static void executeTest(File testFile) {
        TestFileResult result = new TestFileResult(testFile.getName());
        long startTime = System.currentTimeMillis();

        try {
            System.out.println("\n" + BLUE + "📄 Testing: " + testFile.getName() + RESET);
            log("Testing: " + testFile.getName());

            // Run Maven test for this specific test class
            ProcessBuilder pb = new ProcessBuilder(
                "mvn", 
                "test",
                "-Dtest=" + result.testClassName,
                "-B",  // Batch mode
                "-q"   // Quiet
            );

            pb.directory(new File("."));
            pb.redirectErrorStream(true);

            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();
            result.executionTime = System.currentTimeMillis() - startTime;
            result.passed = (exitCode == 0);

            // Parse test results from Maven output
            parseTestResults(result, output.toString());
            statistics.addFileResult(result);

            // Print result
            result.print();
            log(result.testClassName + ": " + (result.passed ? "PASS" : "FAIL"));

        } catch (Exception e) {
            result.executionTime = System.currentTimeMillis() - startTime;
            result.passed = false;
            result.errors.add(e.getMessage());
            System.out.println(RED + "✗ ERROR: " + e.getMessage() + RESET);
            log("ERROR: " + e.getMessage());
            statistics.addFileResult(result);
        }
    }

    /**
     * Parse Maven test output
     */
    private static void parseTestResults(TestFileResult result, String output) {
        // Extract test counts from Maven output
        Pattern testsRunPattern = Pattern.compile("Tests run: (\\d+)");
        Pattern failuresPattern = Pattern.compile("Failures: (\\d+)");
        Pattern errorsPattern = Pattern.compile("Errors: (\\d+)");
        Pattern skippedPattern = Pattern.compile("Skipped: (\\d+)");

        Matcher testsRunMatcher = testsRunPattern.matcher(output);
        Matcher failuresMatcher = failuresPattern.matcher(output);
        Matcher errorsMatcher = errorsPattern.matcher(output);
        Matcher skippedMatcher = skippedPattern.matcher(output);

        if (testsRunMatcher.find()) {
            result.testCount = Integer.parseInt(testsRunMatcher.group(1));
        }

        if (failuresMatcher.find()) {
            int failures = Integer.parseInt(failuresMatcher.group(1));
            result.failedCount = failures;
        }

        if (errorsMatcher.find()) {
            int errors = Integer.parseInt(errorsMatcher.group(1));
            result.failedCount += errors;
        }

        if (skippedMatcher.find()) {
            result.skippedCount = Integer.parseInt(skippedMatcher.group(1));
        }

        result.passedCount = result.testCount - result.failedCount - result.skippedCount;

        // Extract error messages
        String[] lines = output.split("\n");
        for (String errorLine : lines) {
            if (errorLine.contains("FAILED") || errorLine.contains("ERROR")) {
                result.errors.add(errorLine.trim());
            }
        }
    }

    /**
     * Generate test reports
     */
    private static void generateReports() throws IOException {
        System.out.println(BOLD + CYAN + "\n[3] GENERATING REPORTS..." + RESET);
        log("\nGenerating reports...");

        // Print summary
        statistics.printSummary();

        // Generate detailed report
        reportWriter.println("╔" + "═".repeat(78) + "╗");
        reportWriter.println("║" + " ".repeat(25) + "SMARTCARE API - TEST REPORT" + " ".repeat(26) + "║");
        reportWriter.println("╚" + "═".repeat(78) + "╝");
        reportWriter.println();
        reportWriter.println("Generated: " + LocalDateTime.now().format(dateFormatter));
        reportWriter.println();

        reportWriter.println("═".repeat(80));
        reportWriter.println("TEST SUMMARY");
        reportWriter.println("═".repeat(80));
        reportWriter.println("Total Tests: " + statistics.totalTests);
        reportWriter.println("Passed: " + statistics.passedTests);
        reportWriter.println("Failed: " + statistics.failedTests);
        reportWriter.println("Skipped: " + statistics.skippedTests);
        reportWriter.println("Total Execution Time: " + statistics.totalExecutionTime + "ms");
        reportWriter.println();

        reportWriter.println("═".repeat(80));
        reportWriter.println("DETAILED RESULTS");
        reportWriter.println("═".repeat(80));
        reportWriter.println();

        for (TestFileResult result : statistics.fileResults) {
            reportWriter.println("Test File: " + result.testClassName);
            reportWriter.println("  Status: " + (result.passed ? "PASS" : "FAIL"));
            reportWriter.println("  Tests: " + result.testCount);
            reportWriter.println("  Passed: " + result.passedCount);
            reportWriter.println("  Failed: " + result.failedCount);
            reportWriter.println("  Skipped: " + result.skippedCount);
            reportWriter.println("  Execution Time: " + result.executionTime + "ms");
            
            if (!result.errors.isEmpty()) {
                reportWriter.println("  Errors:");
                result.errors.forEach(error -> reportWriter.println("    - " + error));
            }
            reportWriter.println();
        }

        // List all files
        System.out.println(BOLD + "Test Files Executed:" + RESET);
        for (TestFileResult result : statistics.fileResults) {
            String statusIcon = result.passed ? GREEN + "✓" : RED + "✗";
            System.out.println("  " + statusIcon + RESET + " " + result.testClassName);
        }

        log("Reports generated successfully");
        System.out.println(GREEN + "✓ Reports generated in " + TEST_RESULTS_DIR + " directory" + RESET);
    }

    /**
     * Cleanup and close resources
     */
    private static void cleanup() {
        log("Test Execution Completed: " + LocalDateTime.now().format(dateFormatter));
        
        if (logWriter != null) {
            logWriter.close();
        }
        if (reportWriter != null) {
            reportWriter.close();
        }

        System.out.println(BOLD + GREEN + "\n✓ Test execution completed successfully!" + RESET);
    }

    /**
     * Log message to both console and file
     */
    private static void log(String message) {
        if (logWriter != null) {
            logWriter.println("[" + LocalDateTime.now().format(dateFormatter) + "] " + message);
        }
    }
}
