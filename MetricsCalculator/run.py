import json
import sys
import time

# Metric Calculation Functions
def calculate_ramp_up(package_data):
    if "readme" in package_data or "description" in package_data or "main" in package_data:
        return 0.7  # Example: well-documented
    return 0.3  # Poorly documented

def calculate_correctness(package_lock):
    outdated = 0
    total = len(package_lock.get("packages", {}))
    for pkg in package_lock.get("packages", {}).values():
        if pkg.get("dev"):  # Example check: consider dev dependencies
            outdated += 1
    return 1 - (outdated / total if total else 0)

def calculate_bus_factor(package_data):
    return 0.5 if "author" in package_data else 0.2

def calculate_responsive_maintainer(package_lock):
    recent_updates = [pkg for pkg in package_lock.get("packages", {}).values() if "time" in pkg]
    return 0.8 if recent_updates else 0.2

def calculate_license(package_data):
    license_type = package_data.get("license", "").lower()
    if license_type in ["mit", "apache-2.0", "lgpl-2.1-only"]:
        return 1.0
    return 0.0

# Handle Missing Metrics
def handle_missing_metrics(metric_function, *args):
    try:
        return metric_function(*args)
    except Exception:
        return -1

# Calculate Metrics and Latencies
def calculate_metrics(package_data, package_lock):
    metrics = {}
    start = time.time()
    metrics["RampUp"] = handle_missing_metrics(calculate_ramp_up, package_data)
    metrics["RampUp_Latency"] = round(time.time() - start, 3)

    start = time.time()
    metrics["Correctness"] = handle_missing_metrics(calculate_correctness, package_lock)
    metrics["Correctness_Latency"] = round(time.time() - start, 3)

    start = time.time()
    metrics["BusFactor"] = handle_missing_metrics(calculate_bus_factor, package_data)
    metrics["BusFactor_Latency"] = round(time.time() - start, 3)

    start = time.time()
    metrics["ResponsiveMaintainer"] = handle_missing_metrics(calculate_responsive_maintainer, package_lock)
    metrics["ResponsiveMaintainer_Latency"] = round(time.time() - start, 3)

    start = time.time()
    metrics["License"] = handle_missing_metrics(calculate_license, package_data)
    metrics["License_Latency"] = round(time.time() - start, 3)

    # Example NetScore calculation
    metrics["NetScore"] = sum([metrics["RampUp"], metrics["Correctness"], metrics["BusFactor"],
                               metrics["ResponsiveMaintainer"], metrics["License"]]) / 5
    metrics["NetScore_Latency"] = round(time.time() - start, 3)

    return metrics

# Read Input Files
def read_files(package_path, package_lock_path):
    with open(package_path, "r") as pkg_file, open(package_lock_path, "r") as lock_file:
        package_data = json.load(pkg_file)
        package_lock = json.load(lock_file)
    return package_data, package_lock

# Main Function
if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: ./run.py <path_to_package.json> <path_to_package-lock.json>")
        sys.exit(1)

    package_data, package_lock = read_files(sys.argv[1], sys.argv[2])
    result = calculate_metrics(package_data, package_lock)
    print(json.dumps(result, indent=2))
