#!/bin/bash

################################################################################
#                    COMPREHENSIVE TEST EXECUTION SCRIPT
#                    SmartCare API Test Suite Runner
################################################################################
#
# This script:
# 1. Discovers all test files (*Test.java, *Tests.java)
# 2. Compiles them with Maven
# 3. Executes each test file individually
# 4. Generates detailed logs and reports
# 5. Tracks pass/fail for each test file
#
# Features:
# - Color-coded output
# - Detailed logging
# - Per-file pass/fail tracking
# - Comprehensive summary report
#
# Usage: ./run_all_tests.sh
#
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Directories
PROJECT_ROOT="$(pwd)"
TEST_DIR="${PROJECT_ROOT}/src/test/java/com/smartcare"
RESULTS_DIR="${PROJECT_ROOT}/test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Log files
LOG_FILE="${RESULTS_DIR}/test-execution_${TIMESTAMP}.log"
SUMMARY_FILE="${RESULTS_DIR}/test-summary_${TIMESTAMP}.txt"
ERROR_LOG="${RESULTS_DIR}/test-errors_${TIMESTAMP}.log"

# Statistics
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0
TOTAL_TIME=0

# Arrays to store results
declare -a PASSED_FILES
declare -a FAILED_FILES

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BOLD}${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════════════════╗"
    echo "║             SMARTCARE API - COMPREHENSIVE TEST RUNNER                    ║"
    echo "║                  Following Software Testing Principles                    ║"
    echo "║  (TDD, Black-Box, White-Box, Boundary Testing, Exception Handling)       ║"
    echo "╚════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
}

print_section() {
    echo -e "\n${BOLD}${CYAN}[$1]${NC} $2\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "${LOG_FILE}"
}

################################################################################
# Main Functions
################################################################################

initialize() {
    print_section "INIT" "Initializing test runner"
    
    # Create results directory
    mkdir -p "${RESULTS_DIR}"
    
    # Initialize log files
    echo "Test Execution Started: $(date +'%Y-%m-%d %H:%M:%S')" > "${LOG_FILE}"
    echo "Project Root: ${PROJECT_ROOT}" >> "${LOG_FILE}"
    echo "Test Directory: ${TEST_DIR}" >> "${LOG_FILE}"
    echo "" > "${ERROR_LOG}"
    
    print_success "Initialized test runner"
    print_success "Results will be saved to: ${RESULTS_DIR}"
    log_message "Test runner initialized"
}

discover_tests() {
    print_section "DISCOVER" "Discovering test files"
    
    if [ ! -d "${TEST_DIR}" ]; then
        print_error "Test directory not found: ${TEST_DIR}"
        log_message "ERROR: Test directory not found"
        return 1
    fi
    
    # Find all test files
    TEST_FILES=($(find "${TEST_DIR}" -name "*Test.java" -o -name "*Tests.java" 2>/dev/null | sort))
    
    if [ ${#TEST_FILES[@]} -eq 0 ]; then
        print_warning "No test files found in ${TEST_DIR}"
        log_message "WARNING: No test files found"
        return 1
    fi
    
    print_success "Found ${#TEST_FILES[@]} test file(s):"
    for file in "${TEST_FILES[@]}"; do
        echo "  - $(basename "${file}")"
        log_message "Found test file: $(basename "${file}")"
    done
}

execute_tests() {
    print_section "EXECUTE" "Executing all test files"
    
    local test_count=0
    
    for test_file in "${TEST_FILES[@]}"; do
        test_count=$((test_count + 1))
        local test_name=$(basename "${test_file}" .java)
        local test_class=$(echo "${test_name}" | sed 's/\.java$//')
        
        echo -e "\n${BLUE}[${test_count}/${#TEST_FILES[@]}]${NC} Executing: ${test_name}"
        echo "────────────────────────────────────────────────────────────"
        
        local start_time=$(date +%s%N)
        
        # Run the specific test
        if mvn test -Dtest="${test_class}" -B 2>&1 | tee -a "${LOG_FILE}" > /tmp/test_output.log; then
            local end_time=$(date +%s%N)
            local duration=$((($end_time - $start_time) / 1000000))
            
            print_success "${test_name} PASSED (${duration}ms)"
            PASSED_FILES+=("${test_name}")
            PASSED_TESTS=$((PASSED_TESTS + 1))
            
            log_message "PASS: ${test_name} (${duration}ms)"
        else
            local end_time=$(date +%s%N)
            local duration=$((($end_time - $start_time) / 1000000))
            
            print_error "${test_name} FAILED (${duration}ms)"
            FAILED_FILES+=("${test_name}")
            FAILED_TESTS=$((FAILED_TESTS + 1))
            
            # Log errors
            grep -i "error\|failure\|exception" /tmp/test_output.log >> "${ERROR_LOG}" 2>/dev/null || true
            log_message "FAIL: ${test_name} (${duration}ms)"
        fi
        
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
    done
}

generate_reports() {
    print_section "REPORT" "Generating test reports"
    
    # Calculate statistics
    local success_rate=0
    if [ ${TOTAL_TESTS} -gt 0 ]; then
        success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi
    
    # Generate summary report
    {
        echo "╔════════════════════════════════════════════════════════════════════════════╗"
        echo "║                     SMARTCARE API - TEST SUMMARY REPORT                   ║"
        echo "╚════════════════════════════════════════════════════════════════════════════╝"
        echo ""
        echo "Generated: $(date +'%Y-%m-%d %H:%M:%S')"
        echo "Project: SmartCare API"
        echo "Test Framework: JUnit 5 + Mockito"
        echo "Maven: $(mvn --version 2>/dev/null | head -n1)"
        echo ""
        echo "════════════════════════════════════════════════════════════════════════════"
        echo "OVERALL STATISTICS"
        echo "════════════════════════════════════════════════════════════════════════════"
        echo "Total Tests Run:        ${TOTAL_TESTS}"
        echo "Passed:                 ${PASSED_TESTS}"
        echo "Failed:                 ${FAILED_TESTS}"
        echo "Success Rate:           ${success_rate}%"
        echo ""
        echo "════════════════════════════════════════════════════════════════════════════"
        echo "TEST FILES - PASSED (${#PASSED_FILES[@]})"
        echo "════════════════════════════════════════════════════════════════════════════"
        for file in "${PASSED_FILES[@]}"; do
            echo "  ✓ ${file}"
        done
        echo ""
        echo "════════════════════════════════════════════════════════════════════════════"
        echo "TEST FILES - FAILED (${#FAILED_FILES[@]})"
        echo "════════════════════════════════════════════════════════════════════════════"
        for file in "${FAILED_FILES[@]}"; do
            echo "  ✗ ${file}"
        done
        echo ""
        echo "════════════════════════════════════════════════════════════════════════════"
        echo "DETAILS"
        echo "════════════════════════════════════════════════════════════════════════════"
        echo "Test Directory:  ${TEST_DIR}"
        echo "Results Directory: ${RESULTS_DIR}"
        echo "Log File:        ${LOG_FILE}"
        echo "Error Log:       ${ERROR_LOG}"
        echo ""
    } > "${SUMMARY_FILE}"
    
    # Print summary to console
    echo ""
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}                          TEST EXECUTION SUMMARY${NC}"
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Total Tests:        ${BOLD}${TOTAL_TESTS}${NC}"
    echo -e "Passed:             ${BOLD}${GREEN}${PASSED_TESTS}${NC}"
    echo -e "Failed:             ${BOLD}${RED}${FAILED_TESTS}${NC}"
    echo -e "Success Rate:       ${BOLD}${success_rate}%${NC}"
    echo ""
    echo -e "${BOLD}Passed Test Files:${NC}"
    for file in "${PASSED_FILES[@]}"; do
        echo -e "  ${GREEN}✓${NC} ${file}"
    done
    echo ""
    echo -e "${BOLD}Failed Test Files:${NC}"
    for file in "${FAILED_FILES[@]}"; do
        echo -e "  ${RED}✗${NC} ${file}"
    done
    echo ""
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    print_success "Summary report generated: ${SUMMARY_FILE}"
    print_success "Detailed log generated: ${LOG_FILE}"
    
    if [ ${#FAILED_FILES[@]} -gt 0 ]; then
        print_warning "Error details saved to: ${ERROR_LOG}"
    fi
    
    log_message "Reports generated successfully"
}

cleanup() {
    print_section "CLEANUP" "Finalizing test execution"
    
    rm -f /tmp/test_output.log
    
    log_message "Test Execution Completed: $(date +'%Y-%m-%d %H:%M:%S')"
    
    if [ ${FAILED_TESTS} -eq 0 ]; then
        print_success "All tests passed! 🎉"
        echo ""
        return 0
    else
        print_error "${FAILED_TESTS} test(s) failed"
        echo ""
        return 1
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header
    
    initialize
    discover_tests || exit 1
    execute_tests
    generate_reports
    cleanup
    
    # Return appropriate exit code
    if [ ${FAILED_TESTS} -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"
