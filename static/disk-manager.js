// DISK MANAGEMENT TOOLKIT

let diskScanInterval = null;
let lastAnomalyScore = 0;

// Initialize disk management
function initDiskManagement() {
    // Load disk overview on page load
    loadDiskOverview();
    
    // Setup scan button
    const scanBtn = document.getElementById('scanDiskBtn');
    if (scanBtn) {
        scanBtn.addEventListener('click', triggerDiskScan);
    }
    
    // Setup collapsible sections
    setupCollapsibleSections();
    
    // Check for root cause analysis periodically
    setInterval(checkRootCauseAnalysis, 5000);
}

// Setup collapsible section handlers
function setupCollapsibleSections() {
    const headers = [
        'rootCauseHeader',
        'largestHeader',
        'growingHeader'
    ];
    
    headers.forEach(headerId => {
        const header = document.getElementById(headerId);
        if (header) {
            header.addEventListener('click', () => {
                toggleSection(headerId);
            });
        }
    });
}

// Toggle collapsible section
function toggleSection(headerId) {
    const header = document.getElementById(headerId);
    const contentId = headerId.replace('Header', 'Content');
    const content = document.getElementById(contentId);
    
    if (header && content) {
        header.classList.toggle('collapsed');
        content.classList.toggle('collapsed');
    }
}

// Load disk overview
function loadDiskOverview() {
    fetch('/api/disk/overview')
        .then(res => res.json())
        .then(data => {
            document.getElementById('diskTotal').textContent = formatBytes(data.total_bytes);
            document.getElementById('diskUsed').textContent = formatBytes(data.used_bytes);
            document.getElementById('diskFree').textContent = formatBytes(data.free_bytes);
            document.getElementById('diskUsage').textContent = `${data.usage_percent}%`;
        })
        .catch(err => console.error('Failed to load disk overview:', err));
}

// Trigger filesystem scan
function triggerDiskScan() {
    const scanBtn = document.getElementById('scanDiskBtn');
    if (!scanBtn) return;
    
    // Disable button and show scanning state
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<div class="scanning-spinner"></div> Scanning entire drive...';
    
    // Show info message
    console.log('Starting full drive scan. This may take 2-5 minutes on first scan...');
    
    fetch('/api/disk/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log(`Scanning from: ${data.scan_path || 'drive root'}`);
            // Poll for scan completion
            diskScanInterval = setInterval(checkScanStatus, 3000);  // Check every 3 seconds
        } else {
            alert('Failed to start scan: ' + data.message);
            resetScanButton();
        }
    })
    .catch(err => {
        console.error('Scan error:', err);
        alert('Failed to start scan');
        resetScanButton();
    });
}

// Check scan status and load results
function checkScanStatus() {
    fetch('/api/disk/treemap?path=C:\\')
        .then(res => res.json())
        .then(data => {
            if (data.directories && data.directories.length > 0) {
                // Scan complete
                clearInterval(diskScanInterval);
                diskScanInterval = null;
                resetScanButton();
                
                // Load disk data (but NOT root cause - that's only for anomalies)
                loadFastestGrowing();
                loadPerformanceStats();
                
                // Reload treemap visualization
                if (window.treemapViz) {
                    treemapViz.loadDrives();
                }
            }
        })
        .catch(err => console.error('Status check error:', err));
}

// Load performance statistics
function loadPerformanceStats() {
    fetch('/api/disk/performance')
        .then(res => res.json())
        .then(data => {
            console.log('Scan Performance:', data);
            console.log(`  Duration: ${data.last_scan_duration}s`);
            console.log(`  Cache hit rate: ${data.cache_hit_rate}%`);
            console.log(`  Directories scanned: ${data.directories_scanned}`);
            console.log(`  Directories cached: ${data.directories_cached}`);
        })
        .catch(err => console.error('Performance stats error:', err));
}

// Reset scan button
function resetScanButton() {
    const scanBtn = document.getElementById('scanDiskBtn');
    if (scanBtn) {
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<span>🔍</span> Scan Filesystem';
    }
}

// Check if root cause analysis should be shown
function checkRootCauseAnalysis() {
    // Only show root cause when anomaly count increases
    const anomalyCount = parseInt(document.getElementById('anomalyCount')?.textContent || '0');
    
    if (anomalyCount > lastAnomalyScore) {
        lastAnomalyScore = anomalyCount;
        // Anomaly detected - show root cause analysis
        loadRootCauseAnalysis();
    }
}

// Load root cause analysis (only called when anomaly detected)
function loadRootCauseAnalysis() {
    fetch('/api/disk/root-cause')
        .then(res => res.json())
        .then(data => {
            if (data.scan_available && data.directories && data.directories.length > 0) {
                // Filter to only show directories with significant impact
                const significantDirs = data.directories.filter(dir => dir.impact_score > 0.3);
                
                if (significantDirs.length > 0) {
                    // Show root cause section
                    const section = document.getElementById('rootCauseSection');
                    if (section) {
                        section.style.display = 'block';
                    }
                    
                    // Populate list
                    const list = document.getElementById('rootCauseList');
                    if (list) {
                        list.innerHTML = significantDirs.map(dir => createDirectoryItem(dir, true)).join('');
                    }
                    
                    // Expand by default
                    const header = document.getElementById('rootCauseHeader');
                    const content = document.getElementById('rootCauseContent');
                    if (header && content) {
                        header.classList.remove('collapsed');
                        content.classList.remove('collapsed');
                    }
                }
            }
        })
        .catch(err => console.error('Root cause analysis error:', err));
}

// Load fastest growing directories
function loadFastestGrowing() {
    fetch('/api/disk/growing')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('growingList');
            if (list && data.directories) {
                if (data.directories.length === 0) {
                    list.innerHTML = '<p class="empty-state">No growth detected yet. Run another scan later to see changes.</p>';
                } else {
                    list.innerHTML = data.directories.map(dir => createGrowthDirectoryItem(dir)).join('');
                }
            }
        })
        .catch(err => console.error('Growing directories error:', err));
}

// Load most active directories
function loadMostActive() {
    fetch('/api/disk/active')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('activeList');
            if (list && data.directories) {
                if (data.directories.length === 0) {
                    list.innerHTML = '<p class="empty-state">No recent activity detected</p>';
                } else {
                    list.innerHTML = data.directories.map(dir => createActiveDirectoryItem(dir)).join('');
                }
            }
        })
        .catch(err => console.error('Active directories error:', err));
}

// Create directory item for root cause analysis
function createDirectoryItem(dir, showImpact = false) {
    const severityClass = dir.severity || 'low';
    
    // Show size delta only if it's significant (> 1MB)
    const showDelta = Math.abs(dir.size_delta) > 1024 * 1024;
    
    return `
        <div class="directory-item severity-${severityClass}">
            <div class="directory-header">
                <div class="directory-path">${escapeHtml(dir.path)}</div>
                ${showImpact ? `<div class="impact-badge ${severityClass}">${dir.impact_score}</div>` : ''}
            </div>
            <div class="directory-stats">
                <div class="stat-row">
                    <span class="stat-row-label">Total Size:</span>
                    <span class="stat-row-value">${dir.total_size_formatted}</span>
                </div>
                ${showDelta ? `
                <div class="stat-row">
                    <span class="stat-row-label">Size Change:</span>
                    <span class="stat-row-value">${dir.size_delta > 0 ? '+' : ''}${dir.size_delta_formatted}</span>
                </div>
                ` : ''}
                <div class="stat-row">
                    <span class="stat-row-label">Modifications:</span>
                    <span class="stat-row-value">${dir.recent_modifications_count}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-row-label">New Files:</span>
                    <span class="stat-row-value">${dir.new_files_count}</span>
                </div>
            </div>
        </div>
    `;
}

// Create simple directory item
function createSimpleDirectoryItem(dir, type) {
    return `
        <div class="directory-item">
            <div class="directory-header">
                <div class="directory-path">${escapeHtml(dir.path)}</div>
            </div>
            <div class="directory-stats">
                <div class="stat-row">
                    <span class="stat-row-label">Total Size:</span>
                    <span class="stat-row-value">${dir.total_size_formatted}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-row-label">File Count:</span>
                    <span class="stat-row-value">${dir.file_count}</span>
                </div>
            </div>
        </div>
    `;
}

// Create growth directory item
function createGrowthDirectoryItem(dir) {
    return `
        <div class="directory-item">
            <div class="directory-header">
                <div class="directory-path">${escapeHtml(dir.path)}</div>
            </div>
            <div class="directory-stats">
                <div class="stat-row">
                    <span class="stat-row-label">Growth:</span>
                    <span class="stat-row-value">${dir.size_delta_formatted}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-row-label">Growth Rate:</span>
                    <span class="stat-row-value">${dir.growth_rate}%</span>
                </div>
                <div class="stat-row">
                    <span class="stat-row-label">Total Size:</span>
                    <span class="stat-row-value">${dir.total_size_formatted}</span>
                </div>
            </div>
        </div>
    `;
}

// Create active directory item
function createActiveDirectoryItem(dir) {
    return `
        <div class="directory-item">
            <div class="directory-header">
                <div class="directory-path">${escapeHtml(dir.path)}</div>
            </div>
            <div class="directory-stats">
                <div class="stat-row">
                    <span class="stat-row-label">Modifications:</span>
                    <span class="stat-row-value">${dir.recent_modifications_count}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-row-label">New Files:</span>
                    <span class="stat-row-value">${dir.new_files_count}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-row-label">Total Size:</span>
                    <span class="stat-row-value">${dir.total_size_formatted}</span>
                </div>
            </div>
        </div>
    `;
}

// Format bytes to human-readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiskManagement);
} else {
    initDiskManagement();
}
