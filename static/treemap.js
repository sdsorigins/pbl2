// TREEMAP + PIE CHART SPLIT VISUALIZATION

class TreemapVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentPath = null;
        this.pathHistory = [];
        this.currentData = [];
        this.pieChart = null;
        this.colors = [
            'rgba(139, 92, 246, 0.85)',
            'rgba(167, 139, 250, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(59, 130, 246, 0.85)',
            'rgba(236, 72, 153, 0.85)',
            'rgba(34, 197, 94, 0.85)',
            'rgba(196, 181, 253, 0.85)',
            'rgba(251, 113, 133, 0.85)',
            'rgba(52, 211, 153, 0.85)',
        ];
    }

    async loadDrives() {
        this.showLoading('Loading drives...');
        try {
            const response = await fetch('/api/disk/drives');
            const data = await response.json();
            if (data.drives && data.drives.length > 0) {
                this.currentData = data.drives.map(d => ({
                    name: d.name,
                    size: d.used_size,
                    sizeFormatted: d.used_size_formatted,
                    path: d.path
                }));
                this.currentPath = null;
                this.pathHistory = [];
                this.renderBlocks('Drives', false);
                this.renderPie();
            } else {
                this.showBlocksMessage('No drives found', false);
            }
        } catch (error) {
            console.error('Failed to load drives:', error);
            this.showBlocksMessage('Failed to load drives', false);
        }
    }

    async loadDirectory(path) {
        this.showLoading(`Loading ${path}...`);
        try {
            const response = await fetch(`/api/disk/treemap?path=${encodeURIComponent(path)}`);
            const data = await response.json();

            if (data.directories && data.directories.length > 0) {
                // Push current state to history BEFORE changing
                this.pathHistory.push({ path: this.currentPath, data: [...this.currentData] });
                this.currentPath = path;
                this.currentData = data.directories.map(d => ({
                    name: d.name,
                    size: d.size,
                    sizeFormatted: d.size_formatted,
                    path: d.path
                }));
                this.renderBlocks(path, true);
                this.renderPie();
            } else {
                // No subdirs — keep current pie chart, just show message in blocks
                const label = this.currentPath || 'Drives';
                this.renderBlocks(label, this.pathHistory.length > 0);
                this.showBlocksAppendMessage(`"${this._basename(path)}" has no subdirectories`);
                // Pie chart stays as-is (don't touch it)
            }
        } catch (error) {
            console.error('Failed to load directory:', error);
            const label = this.currentPath || 'Drives';
            this.renderBlocks(label, this.pathHistory.length > 0);
            this.showBlocksAppendMessage('Failed to load directory');
        }
    }

    renderBlocks(label, showBack) {
        this.container.innerHTML = '';

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'treemap-breadcrumb';
        if (showBack) {
            const backBtn = document.createElement('button');
            backBtn.className = 'treemap-back-btn';
            backBtn.innerHTML = '← Back';
            backBtn.addEventListener('click', () => this.goBack());
            breadcrumb.appendChild(backBtn);
        }
        const pathEl = document.createElement('div');
        pathEl.className = 'treemap-path';
        pathEl.textContent = label;
        pathEl.title = label;
        breadcrumb.appendChild(pathEl);
        this.container.appendChild(breadcrumb);

        // Blocks container
        const treemapContainer = document.createElement('div');
        treemapContainer.className = 'treemap-container';
        this.container.appendChild(treemapContainer);

        const totalSize = this.currentData.reduce((sum, d) => sum + d.size, 0);

        this.currentData.forEach((item, index) => {
            const percentage = totalSize > 0 ? (item.size / totalSize) * 100 : 0;
            const block = this.createBlock(
                item.name,
                item.sizeFormatted,
                percentage,
                this.colors[index % this.colors.length],
                () => this.loadDirectory(item.path)
            );
            treemapContainer.appendChild(block);
        });
    }

    // Append a small info message below existing blocks (doesn't replace them)
    showBlocksAppendMessage(msg) {
        const info = document.createElement('div');
        info.className = 'treemap-info-msg';
        info.textContent = msg;
        this.container.appendChild(info);
    }

    renderPie() {
        const canvas = document.getElementById('diskPieChart');
        const legendEl = document.getElementById('pieLegend');
        if (!canvas) return;

        if (this.pieChart) {
            this.pieChart.destroy();
            this.pieChart = null;
        }

        if (!this.currentData || this.currentData.length === 0) return;

        const totalSize = this.currentData.reduce((sum, d) => sum + d.size, 0);
        const bgColors = this.currentData.map((_, i) => this.colors[i % this.colors.length]);

        this.pieChart = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: this.currentData.map(d => d.name),
                datasets: [{
                    data: this.currentData.map(d => d.size),
                    backgroundColor: bgColors,
                    borderColor: bgColors.map(c => c.replace('0.85', '1')),
                    borderWidth: 2,
                    hoverBorderWidth: 3,
                    hoverOffset: 14
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: { duration: 500, easing: 'easeInOutQuart' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 10, 21, 0.95)',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        borderWidth: 1,
                        titleColor: '#ffffff',
                        bodyColor: '#c4b5fd',
                        padding: 12,
                        callbacks: {
                            title: (items) => this.currentData[items[0].dataIndex]?.name || '',
                            label: (ctx) => {
                                const item = this.currentData[ctx.dataIndex];
                                const pct = totalSize > 0 ? ((item.size / totalSize) * 100).toFixed(1) : '0';
                                return ` ${item.sizeFormatted}  (${pct}%)`;
                            }
                        }
                    }
                },
                onClick: (evt, elements) => {
                    if (elements.length > 0) {
                        const idx = elements[0].index;
                        const item = this.currentData[idx];
                        if (item && item.path) this.loadDirectory(item.path);
                    }
                }
            }
        });

        // Legend
        if (legendEl) {
            legendEl.innerHTML = '';
            this.currentData.forEach((item, i) => {
                const pct = totalSize > 0 ? ((item.size / totalSize) * 100).toFixed(1) : '0';
                const row = document.createElement('div');
                row.className = 'pie-legend-item';
                row.title = `Click to drill into ${item.name}`;
                row.innerHTML = `
                    <span class="pie-legend-dot" style="background:${this.colors[i % this.colors.length]}"></span>
                    <span class="pie-legend-name">${item.name}</span>
                    <span class="pie-legend-size">${item.sizeFormatted}</span>
                    <span class="pie-legend-pct">${pct}%</span>
                `;
                row.addEventListener('click', () => this.loadDirectory(item.path));
                legendEl.appendChild(row);
            });
        }
    }

    createBlock(name, sizeText, percentage, color, onClick) {
        const block = document.createElement('div');
        block.className = 'treemap-block';

        let width;
        if (percentage < 2) width = 20;
        else if (percentage < 5) width = 25;
        else if (percentage < 10) width = 30;
        else if (percentage < 20) width = 45;
        else width = Math.max(percentage, 48);

        block.style.width = `${width}%`;

        if (percentage < 5) block.style.height = '90px';
        else if (percentage < 10) block.style.height = '110px';
        else if (percentage < 20) block.style.height = '130px';
        else block.style.height = '150px';

        block.style.backgroundColor = color;
        block.style.cursor = 'pointer';

        block.addEventListener('mouseenter', () => {
            block.style.transform = 'scale(1.02)';
            block.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.4)';
        });
        block.addEventListener('mouseleave', () => {
            block.style.transform = 'scale(1)';
            block.style.boxShadow = 'none';
        });

        const content = document.createElement('div');
        content.className = 'treemap-block-content';

        const nameEl = document.createElement('div');
        nameEl.className = 'treemap-block-name';
        nameEl.textContent = name;
        nameEl.title = name;
        if (width < 25) nameEl.style.fontSize = '0.7rem';
        else if (width < 35) nameEl.style.fontSize = '0.8rem';

        const sizeEl = document.createElement('div');
        sizeEl.className = 'treemap-block-size';
        sizeEl.textContent = sizeText;
        if (width < 25) sizeEl.style.fontSize = '0.85rem';
        else if (width < 35) sizeEl.style.fontSize = '0.95rem';

        const percentEl = document.createElement('div');
        percentEl.className = 'treemap-block-percent';
        percentEl.textContent = `${percentage.toFixed(1)}%`;
        if (width < 25) { percentEl.style.fontSize = '0.65rem'; percentEl.style.padding = '2px 6px'; }
        else if (width < 35) { percentEl.style.fontSize = '0.7rem'; percentEl.style.padding = '2px 7px'; }

        content.appendChild(nameEl);
        content.appendChild(sizeEl);
        content.appendChild(percentEl);
        block.appendChild(content);
        block.addEventListener('click', onClick);
        return block;
    }

    showLoading(msg = 'Loading...') {
        this.container.innerHTML = `
            <div class="treemap-message">
                <div class="scanning-spinner"></div>
                <p>${msg}</p>
            </div>
        `;
    }

    goBack() {
        if (this.pathHistory.length > 0) {
            const prev = this.pathHistory.pop();
            this.currentPath = prev.path;
            this.currentData = prev.data;
            const label = prev.path === null ? 'Drives' : prev.path;
            this.renderBlocks(label, this.pathHistory.length > 0);
            this.renderPie();
        } else {
            this.loadDrives();
        }
    }

    _basename(p) {
        return p.replace(/\\/g, '/').split('/').filter(Boolean).pop() || p;
    }
}

let treemapViz = null;

function initTreemap() {
    treemapViz = new TreemapVisualizer('treemapContainer');
    treemapViz.loadDrives();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTreemap);
} else {
    initTreemap();
}
