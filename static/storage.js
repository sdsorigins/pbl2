class StorageManager {
    constructor() {
        this.currentPath = '';
        this.mockData = this.generateMockData();
        this.init();
    }
    
    generateMockData() {
        return {
            drives: [
                { device: 'C:\\', total_gb: 222, used_gb: 118, free_gb: 104, used_percent: 53 },
                { device: 'D:\\', total_gb: 254, used_gb: 204, free_gb: 50, used_percent: 80 }
            ],
            fileTypes: {
                '.mp4': 45678,
                '.jpg': 23456,
                '.png': 18934,
                '.pdf': 12345,
                '.docx': 8765,
                '.zip': 7654,
                '.exe': 6543,
                '.txt': 4321,
                '.psd': 3210,
                '.mp3': 2109
            },
            largeFiles: [
                { name: 'Windows.iso', path: 'C:\\Downloads\\Windows.iso', size_mb: 4892 },
                { name: 'Adobe_Photoshop_2024.zip', path: 'C:\\Downloads\\Adobe_Photoshop_2024.zip', size_mb: 3456 },
                { name: 'Game_Install.exe', path: 'D:\\Games\\Game_Install.exe', size_mb: 2876 },
                { name: 'Video_Project_Final.mp4', path: 'D:\\Videos\\Video_Project_Final.mp4', size_mb: 1987 },
                { name: 'Database_Backup.sql', path: 'C:\\Backups\\Database_Backup.sql', size_mb: 1654 },
                { name: 'VM_Ubuntu.vdi', path: 'D:\\VirtualBox\\VM_Ubuntu.vdi', size_mb: 1432 },
                { name: 'RAW_Photos_2024.zip', path: 'D:\\Photos\\RAW_Photos_2024.zip', size_mb: 1234 },
                { name: 'Music_Library.flac', path: 'D:\\Music\\Music_Library.flac', size_mb: 987 }
            ],
            duplicates: [
                { name: 'vacation_photo.jpg', locations: ['C:\\Pictures\\vacation_photo.jpg', 'D:\\Backup\\vacation_photo.jpg'] },
                { name: 'project_final.docx', locations: ['C:\\Documents\\project_final.docx', 'D:\\Work\\project_final.docx'] },
                { name: 'setup.exe', locations: ['C:\\Downloads\\setup.exe', 'C:\\Temp\\setup.exe'] }
            ],
            cleanup: [
                { type: 'Temporary Files', description: 'System temporary files and cache', size_mb: 4567 },
                { type: 'Old Downloads', description: 'Files in Downloads folder older than 90 days', size_mb: 3421 },
                { type: 'Recycle Bin', description: 'Deleted files waiting to be permanently removed', size_mb: 2345 },
                { type: 'Browser Cache', description: 'Cached web content from all browsers', size_mb: 1876 },
                { type: 'Windows Update Files', description: 'Old Windows update installation files', size_mb: 1234 }
            ]
        };
    }
    
    init() {
        this.bindEvents();
        this.loadDriveOverview();
    }
    
    bindEvents() {
        const analyzeBtn = document.querySelector('.analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.analyzeFileTypes();
            });
        }
        
        const findLargeBtn = document.querySelector('.find-large-btn');
        if (findLargeBtn) {
            findLargeBtn.addEventListener('click', () => {
                this.findLargeFiles();
            });
        }
        
        const findDuplicatesBtn = document.querySelector('.find-duplicates-btn');
        if (findDuplicatesBtn) {
            findDuplicatesBtn.addEventListener('click', () => {
                this.findDuplicates();
            });
        }
        
        const cleanupBtn = document.querySelector('.cleanup-btn');
        if (cleanupBtn) {
            cleanupBtn.addEventListener('click', () => {
                this.getCleanupSuggestions();
            });
        }
    }
    
    loadDriveOverview() {
        this.displayDrives(this.mockData.drives);
    }
    
    displayDrives(drives) {
        const container = document.getElementById('driveOverview');
        const driveSelect = document.getElementById('driveSelect');
        const treeChart = document.getElementById('storageTreeChart');
        
        if (container) {
            container.innerHTML = drives.map(drive => `
                <div class="drive-card glass-card" style="margin-bottom: 1rem; padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-family: 'Playfair Display', serif; font-size: 1.25rem;">${drive.device}</span>
                        <span style="color: var(--vg-wheat);">${drive.used_gb} / ${drive.total_gb} GB</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${drive.used_percent}%;"></div>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                        ${drive.used_percent}% used • ${drive.free_gb} GB free
                    </div>
                </div>
            `).join('');
        }
        
        if (driveSelect) {
            driveSelect.innerHTML = '<option value="">Select Drive...</option>' + 
                drives.map(drive => `<option value="${drive.device}">${drive.device} (${drive.free_gb} GB free)</option>`).join('');
            
            driveSelect.addEventListener('change', (e) => {
                this.currentPath = e.target.value;
                if (this.currentPath) {
                    this.showDirectoryChart();
                }
            });
        }
        
        if (treeChart) {
            const loadingEl = treeChart.parentElement.querySelector('.chart-loading');
            if (loadingEl) loadingEl.classList.add('hidden');
        }
    }
    
    showDirectoryChart() {
        const treeChart = document.getElementById('storageTreeChart');
        const directoryTree = document.getElementById('directoryTree');
        
        if (!treeChart) return;
        
        const loadingEl = treeChart.parentElement.querySelector('.chart-loading');
        if (loadingEl) loadingEl.classList.remove('hidden');
        
        setTimeout(() => {
            const ctx = treeChart.getContext('2d');
            
            const directories = this.currentPath === 'C:\\' ? [
                { name: 'Program Files', size: 45.2 },
                { name: 'Windows', size: 38.7 },
                { name: 'Users', size: 28.4 },
                { name: 'Program Files (x86)', size: 22.1 },
                { name: 'ProgramData', size: 15.8 },
                { name: 'Downloads', size: 12.3 }
            ] : [
                { name: 'Games', size: 78.5 },
                { name: 'Videos', size: 52.3 },
                { name: 'Photos', size: 34.8 },
                { name: 'Music', size: 21.6 },
                { name: 'VirtualBox', size: 15.2 }
            ];
            
            if (window.directoryChart) {
                window.directoryChart.destroy();
            }
            
            window.directoryChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: directories.map(d => d.name),
                    datasets: [{
                        label: 'Size (GB)',
                        data: directories.map(d => d.size),
                        backgroundColor: 'rgba(232, 201, 122, 0.6)',
                        borderColor: '#c8840a',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(10, 22, 48, 0.95)',
                            titleColor: '#e8c97a',
                            bodyColor: '#e8c97a',
                            borderColor: 'rgba(200, 160, 60, 0.5)',
                            borderWidth: 1,
                            titleFont: { family: 'Playfair Display', size: 14 },
                            bodyFont: { family: 'Crimson Pro', size: 12 }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#e8c97a', font: { family: 'Crimson Pro' } },
                            grid: { color: 'rgba(200, 160, 60, 0.1)' }
                        },
                        y: {
                            ticks: { color: '#e8c97a', font: { family: 'Crimson Pro' } },
                            grid: { display: false }
                        }
                    }
                }
            });
            
            if (directoryTree) {
                directoryTree.innerHTML = directories.map(dir => `
                    <div style="padding: 0.75rem; border-bottom: 1px solid var(--card-border);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-family: 'Crimson Pro', serif;">${this.currentPath}${dir.name}</span>
                            <span style="color: var(--vg-wheat); font-weight: 600;">${dir.size} GB</span>
                        </div>
                        <div class="progress-bar" style="height: 4px;">
                            <div class="progress-fill" style="width: ${(dir.size / 80 * 100)}%;"></div>
                        </div>
                    </div>
                `).join('');
            }
            
            if (loadingEl) loadingEl.classList.add('hidden');
        }, 600);
    }
    
    analyzeFileTypes() {
        const container = document.getElementById('fileTypesList');
        const chartCanvas = document.getElementById('fileTypesChart');
        
        const loadingEl = chartCanvas?.parentElement.querySelector('.chart-loading');
        if (loadingEl) loadingEl.classList.remove('hidden');
        
        if (container) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">Analyzing file types...</p>';
        }
        
        setTimeout(() => {
            if (container) {
                container.innerHTML = Object.entries(this.mockData.fileTypes)
                    .map(([type, size]) => `
                        <div style="padding: 0.75rem; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-family: 'Crimson Pro', serif;">${type}</span>
                            <span style="color: var(--vg-wheat);">${(size / 1024).toFixed(2)} GB</span>
                        </div>
                    `).join('');
            }
            
            if (chartCanvas) {
                const ctx = chartCanvas.getContext('2d');
                const labels = Object.keys(this.mockData.fileTypes);
                const data = Object.values(this.mockData.fileTypes);
                const colors = [
                    '#c8840a', '#e8c97a', '#3d7abf', '#1a3a6b', '#e88c28',
                    '#aa6639', '#00aa66', '#aa3333', '#6b4a9b', '#c84a8a'
                ];
                
                if (window.fileTypesChart) {
                    window.fileTypesChart.destroy();
                }
                
                window.fileTypesChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: colors,
                            borderColor: 'rgba(10, 22, 48, 0.8)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'right',
                                labels: {
                                    color: '#e8c97a',
                                    font: { family: 'Crimson Pro', size: 11 },
                                    padding: 10
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(10, 22, 48, 0.95)',
                                titleColor: '#e8c97a',
                                bodyColor: '#e8c97a',
                                borderColor: 'rgba(200, 160, 60, 0.5)',
                                borderWidth: 1,
                                titleFont: { family: 'Playfair Display', size: 14 },
                                bodyFont: { family: 'Crimson Pro', size: 12 }
                            }
                        }
                    }
                });
                
                if (loadingEl) loadingEl.classList.add('hidden');
            }
        }, 800);
    }
    
    findLargeFiles() {
        const container = document.getElementById('largeFilesList');
        if (!container) return;
        
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Finding large files...</p>';
        
        setTimeout(() => {
            container.innerHTML = this.mockData.largeFiles.map(file => `
                <div style="padding: 0.75rem; border-bottom: 1px solid var(--card-border);">
                    <div style="font-family: 'Crimson Pro', serif; margin-bottom: 0.25rem; color: var(--vg-wheat);">${file.name}</div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.875rem;">
                        <span style="color: var(--text-secondary);">${file.path}</span>
                        <span style="color: var(--vg-gold); font-weight: 600;">${file.size_mb} MB</span>
                    </div>
                </div>
            `).join('');
        }, 1000);
    }
    
    findDuplicates() {
        const container = document.getElementById('duplicatesList');
        if (!container) return;
        
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Searching for duplicates...</p>';
        
        setTimeout(() => {
            container.innerHTML = this.mockData.duplicates.map(dup => `
                <div style="padding: 0.75rem; border-bottom: 1px solid var(--card-border);">
                    <div style="font-family: 'Crimson Pro', serif; margin-bottom: 0.5rem; color: var(--vg-wheat);">${dup.name}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">
                        ${dup.locations.map(loc => `<div style="padding: 0.25rem 0;">📁 ${loc}</div>`).join('')}
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--vg-gold);">
                        ${dup.locations.length} copies found
                    </div>
                </div>
            `).join('');
        }, 1200);
    }
    
    getCleanupSuggestions() {
        const container = document.getElementById('cleanupSuggestions');
        if (!container) return;
        
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Analyzing for cleanup suggestions...</p>';
        
        setTimeout(() => {
            const totalSavings = this.mockData.cleanup.reduce((sum, item) => sum + item.size_mb, 0);
            
            container.innerHTML = `
                <div style="padding: 1rem; background: rgba(200, 132, 10, 0.1); border-radius: 3px; margin-bottom: 1rem; text-align: center;">
                    <div style="font-family: 'Playfair Display', serif; font-size: 1.5rem; color: var(--vg-wheat);">
                        ${(totalSavings / 1024).toFixed(2)} GB
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">Total potential savings</div>
                </div>
                ${this.mockData.cleanup.map(suggestion => `
                    <div style="padding: 0.75rem; border-bottom: 1px solid var(--card-border);">
                        <div style="font-family: 'Crimson Pro', serif; margin-bottom: 0.25rem; color: var(--vg-wheat);">${suggestion.type}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${suggestion.description}</div>
                        <div style="color: var(--vg-gold); font-weight: 600;">${(suggestion.size_mb / 1024).toFixed(2)} GB can be freed</div>
                    </div>
                `).join('')}
            `;
        }, 900);
    }
}

if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
    window.storageManager = new StorageManager();
}
