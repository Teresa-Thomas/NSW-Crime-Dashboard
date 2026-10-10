const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQd6pc1N-v66OBtnvaFNoXCY9KK3P9GytpLuOKu8oNDGn5dceVLfjuePRVfVdF65W9FZsynahA_TQCS/pub?output=csv';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let rawData = [];
let processedData = [];
let charts = {};

const yearFilter = document.getElementById('year-filter');
const monthFilter = document.getElementById('month-filter');
const areaFilter = document.getElementById('area-filter');
const categoryFilter = document.getElementById('category-filter');
const subcategoryFilter = document.getElementById('subcategory-filter');
const resetBtn = document.getElementById('reset-filters');
const loadingOverlay = document.getElementById('loading-overlay');
const errorOverlay = document.getElementById('error-overlay');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const dataStatus = document.getElementById('data-status');
const lastUpdated = document.getElementById('last-updated');

async function fetchCSV() {
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Failed to fetch CSV:', error);
        throw error;
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 3) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }

    return data;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function transformToLongFormat(rawData) {
    const longData = [];
    const monthColumns = Object.keys(rawData[0] || {}).filter(key => 
        key.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/)
    );

    for (const row of rawData) {
        const area = row['NSW Statistical Area'];
        const category = row['Offence category'];
        const subcategory = row['Subcategory'];

        for (const monthCol of monthColumns) {
            const value = parseInt(row[monthCol], 10);
            if (!isNaN(value) && value > 0) {
                const [monthStr, yearStr] = monthCol.split(' ');
                const monthIndex = monthNames.indexOf(monthStr);
                const year = parseInt(yearStr, 10);
                
                longData.push({
                    area,
                    category,
                    subcategory,
                    year,
                    month: monthIndex + 1,
                    monthName: monthStr,
                    date: new Date(year, monthIndex, 1),
                    count: value
                });
            }
        }
    }

    return longData;
}

function getUniqueValues(data, field) {
    const values = [...new Set(data.map(d => d[field]).filter(v => v))];
    return values.sort();
}

function populateFilters(data) {
    const years = getUniqueValues(data, 'year');
    const areas = getUniqueValues(data, 'area');
    const categories = getUniqueValues(data, 'category');

    yearFilter.innerHTML = '<option value="all">All Years</option>' + 
        years.map(y => `<option value="${y}">${y}</option>`).join('');

    areaFilter.innerHTML = '<option value="all">All Areas</option>' + 
        areas.map(a => `<option value="${a}">${a}</option>`).join('');

    categoryFilter.innerHTML = '<option value="all">All Categories</option>' + 
        categories.map(c => `<option value="${c}">${c}</option>`).join('');

    monthFilter.innerHTML = '<option value="all">All Months</option>' + 
        monthNames.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');

    updateSubcategoryFilter();
}

function updateSubcategoryFilter() {
    const selectedCategory = categoryFilter.value;
    let filteredData = processedData;

    if (selectedCategory !== 'all') {
        filteredData = filteredData.filter(d => d.category === selectedCategory);
    }

    const subcategories = getUniqueValues(filteredData, 'subcategory');
    subcategoryFilter.innerHTML = '<option value="all">All Subcategories</option>' + 
        subcategories.map(s => `<option value="${s}">${s}</option>`).join('');
}

function getFilteredData() {
    let filtered = processedData;

    const year = yearFilter.value;
    const month = monthFilter.value;
    const area = areaFilter.value;
    const category = categoryFilter.value;
    const subcategory = subcategoryFilter.value;

    if (year !== 'all') filtered = filtered.filter(d => d.year === parseInt(year));
    if (month !== 'all') filtered = filtered.filter(d => d.month === parseInt(month));
    if (area !== 'all') filtered = filtered.filter(d => d.area === area);
    if (category !== 'all') filtered = filtered.filter(d => d.category === category);
    if (subcategory !== 'all') filtered = filtered.filter(d => d.subcategory === subcategory);

    return filtered;
}

function updateKPIs(data) {
    const totalIncidents = data.reduce((sum, d) => sum + d.count, 0);
    
    const categoryCounts = {};
    data.forEach(d => {
        categoryCounts[d.category] = (categoryCounts[d.category] || 0) + d.count;
    });
    const topCategory = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0];

    const areaCounts = {};
    data.forEach(d => {
        areaCounts[d.area] = (areaCounts[d.area] || 0) + d.count;
    });
    const topArea = Object.entries(areaCounts)
        .sort((a, b) => b[1] - a[1])[0];

    const latestDate = data.reduce((latest, d) => d.date > latest ? d.date : latest, new Date(0));
    const latestMonthStr = latestDate > new Date(0) 
        ? `${monthNames[latestDate.getMonth()]} ${latestDate.getFullYear()}` 
        : '-';

    document.getElementById('kpi-total-incidents').textContent = formatNumber(totalIncidents);
    document.getElementById('kpi-top-category').textContent = topCategory ? topCategory[0] : '-';
    document.getElementById('kpi-top-area').textContent = topArea ? topArea[0] : '-';
    document.getElementById('kpi-latest-month').textContent = latestMonthStr;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
}

function updateCharts(data) {
    updateTimeChart(data);
    updateCategoryChart(data);
    updateAreaChart(data);
    updateTopAreasChart(data);
    updateRankings(data);
}

function updateTimeChart(data) {
    const monthlyData = {};
    data.forEach(d => {
        const key = `${d.year}-${String(d.month).padStart(2, '0')}`;
        monthlyData[key] = (monthlyData[key] || 0) + d.count;
    });

    const sortedKeys = Object.keys(monthlyData).sort();
    const labels = sortedKeys.map(key => {
        const [year, month] = key.split('-');
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    });
    const values = sortedKeys.map(key => monthlyData[key]);

    const ctx = document.getElementById('chart-time').getContext('2d');
    
    if (charts.time) {
        charts.time.data.labels = labels;
        charts.time.data.datasets[0].data = values;
        charts.time.update('none');
    } else {
        charts.time = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Incidents',
                    data: values,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    borderWidth: 2
                }]
            },
            options: getChartOptions('Incidents Over Time', true)
        });
    }
}

function updateCategoryChart(data) {
    const categoryCounts = {};
    data.forEach(d => {
        categoryCounts[d.category] = (categoryCounts[d.category] || 0) + d.count;
    });

    const sorted = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    const ctx = document.getElementById('chart-category').getContext('2d');
    
    if (charts.category) {
        charts.category.data.labels = sorted.map(d => d[0]);
        charts.category.data.datasets[0].data = sorted.map(d => d[1]);
        charts.category.update('none');
    } else {
        charts.category = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(d => d[0]),
                datasets: [{
                    label: 'Incidents',
                    data: sorted.map(d => d[1]),
                    backgroundColor: 'rgba(37, 99, 235, 0.8)',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: getChartOptions('Incidents by Offence Category', false, true)
        });
    }
}

function updateAreaChart(data) {
    const areaCounts = {};
    data.forEach(d => {
        areaCounts[d.area] = (areaCounts[d.area] || 0) + d.count;
    });

    const sorted = Object.entries(areaCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    const ctx = document.getElementById('chart-area').getContext('2d');
    
    if (charts.area) {
        charts.area.data.labels = sorted.map(d => d[0]);
        charts.area.data.datasets[0].data = sorted.map(d => d[1]);
        charts.area.update('none');
    } else {
        charts.area = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(d => d[0]),
                datasets: [{
                    label: 'Incidents',
                    data: sorted.map(d => d[1]),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4,
                    indexAxis: 'y'
                }]
            },
            options: getChartOptions('Incidents by Area', false, true, true)
        });
    }
}

function updateTopAreasChart(data) {
    const areaCounts = {};
    data.forEach(d => {
        areaCounts[d.area] = (areaCounts[d.area] || 0) + d.count;
    });

    const sorted = Object.entries(areaCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const ctx = document.getElementById('chart-top-areas').getContext('2d');
    const colors = [
        'rgba(245, 158, 11, 0.8)',
        'rgba(148, 163, 184, 0.8)',
        'rgba(205, 127, 50, 0.8)',
        'rgba(37, 99, 235, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(20, 184, 166, 0.8)',
        'rgba(249, 115, 22, 0.8)'
    ];

    if (charts.topAreas) {
        charts.topAreas.data.labels = sorted.map(d => d[0]);
        charts.topAreas.data.datasets[0].data = sorted.map(d => d[1]);
        charts.topAreas.update('none');
    } else {
        charts.topAreas = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sorted.map(d => d[0]),
                datasets: [{
                    data: sorted.map(d => d[1]),
                    backgroundColor: colors.slice(0, sorted.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 12,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ${formatNumber(ctx.raw)}`
                        }
                    }
                }
            }
        });
    }
}

function updateRankings(data) {
    const categoryCounts = {};
    const areaCounts = {};
    const subcategoryCounts = {};

    data.forEach(d => {
        categoryCounts[d.category] = (categoryCounts[d.category] || 0) + d.count;
        areaCounts[d.area] = (areaCounts[d.area] || 0) + d.count;
        subcategoryCounts[d.subcategory] = (subcategoryCounts[d.subcategory] || 0) + d.count;
    });

    const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const topAreas = Object.entries(areaCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const topSubcategories = Object.entries(subcategoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    renderRanking('ranking-categories', topCategories);
    renderRanking('ranking-areas', topAreas);
    renderRanking('ranking-subcategories', topSubcategories);
}

function renderRanking(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map((item, index) => `
        <div class="ranking-item">
            <span class="ranking-rank">${index + 1}</span>
            <span class="ranking-name" title="${item[0]}">${item[0]}</span>
            <span class="ranking-value">${formatNumber(item[1])}</span>
        </div>
    `).join('');
}

function getChartOptions(title, showLegend, horizontal = false, indexAxisY = false) {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: showLegend,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 16,
                    font: { size: 12 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleFont: { size: 13, weight: 600 },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: ctx => `${ctx.dataset.label}: ${formatNumber(ctx.raw)}`
                }
            }
        },
        scales: horizontal ? {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { 
                grid: { color: 'rgba(0,0,0,0.05)' }, 
                ticks: { font: { size: 10 } },
                beginAtZero: true
            }
        } : {
            x: indexAxisY ? { 
                grid: { color: 'rgba(0,0,0,0.05)' }, 
                ticks: { font: { size: 10 } },
                beginAtZero: true
            } : { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: indexAxisY ? { grid: { display: false }, ticks: { font: { size: 10 } } } : { 
                grid: { color: 'rgba(0,0,0,0.05)' }, 
                ticks: { font: { size: 10 } },
                beginAtZero: true
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    };
}

function handleFilterChange() {
    updateSubcategoryFilter();
    const filteredData = getFilteredData();
    updateKPIs(filteredData);
    updateCharts(filteredData);
}

function resetFilters() {
    yearFilter.value = 'all';
    monthFilter.value = 'all';
    areaFilter.value = 'all';
    categoryFilter.value = 'all';
    subcategoryFilter.value = 'all';
    updateSubcategoryFilter();
    const filteredData = getFilteredData();
    updateKPIs(filteredData);
    updateCharts(filteredData);
}

function showError(message) {
    loadingOverlay.classList.add('hidden');
    errorMessage.textContent = message;
    errorOverlay.classList.remove('hidden');
    dataStatus.textContent = 'Error';
    dataStatus.className = 'status-badge error';
}

function showLoading() {
    loadingOverlay.classList.remove('hidden');
    errorOverlay.classList.add('hidden');
    dataStatus.textContent = 'Loading...';
    dataStatus.className = 'status-badge loading';
}

function showReady() {
    loadingOverlay.classList.add('hidden');
    errorOverlay.classList.add('hidden');
    dataStatus.textContent = 'Ready';
    dataStatus.className = 'status-badge ready';
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleString()}`;
}

async function loadData() {
    showLoading();
    
    try {
        const csvText = await fetchCSV();
        rawData = parseCSV(csvText);
        processedData = transformToLongFormat(rawData);
        
        populateFilters(processedData);
        
        const filteredData = getFilteredData();
        updateKPIs(filteredData);
        updateCharts(filteredData);
        
        showReady();
    } catch (error) {
        showError(error.message || 'Failed to load data. Please check your connection and try again.');
    }
}

function initEventListeners() {
    yearFilter.addEventListener('change', handleFilterChange);
    monthFilter.addEventListener('change', handleFilterChange);
    areaFilter.addEventListener('change', handleFilterChange);
    categoryFilter.addEventListener('change', handleFilterChange);
    subcategoryFilter.addEventListener('change', handleFilterChange);
    resetBtn.addEventListener('click', resetFilters);
    retryBtn.addEventListener('click', loadData);

    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const view = this.dataset.view;
            if (charts.time) {
                charts.time.config.type = view === 'area' ? 'line' : 'line';
                charts.time.config.options.plugins.fill = view === 'area';
                charts.time.update();
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadData();
});