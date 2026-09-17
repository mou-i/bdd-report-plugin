/**
 * Modern Enterprise BDD Test Report - Frontend Engine
 * Zero Emojis, Pure SVG Vector Iconography, Icon-first UX (Linear / GitHub / Datadog aesthetic)
 * Real-time multi-tag scalable filtering, lazy attachment rendering,
 * and high-contrast Light/Dark mode support.
 */

(function () {
    'use strict';

    // Application State
    const state = {
        payload: null,
        features: [],
        summary: null,
        searchTerm: '',
        statusFilter: 'all',
        activeTags: new Set(),
        tagSearchTerm: '',
        activeTab: 'scenarios-tab',
        selectedAttachment: null,
        isDarkTheme: false,
        isFullscreen: false,
        tagPopoverOpen: false,
        attachmentUrlBase: '',
        downloadUrlBase: ''
    };

    // Clean SVG Vector Icons Dictionary (Zero Emojis)
    const ICONS = {
        chevron: '<svg class="tree-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>',
        chevronDown: '<svg class="bdd-icon bdd-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>',
        checkCircle: '<svg class="step-status-icon passed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12 11 15 16 9"></polyline></svg>',
        crossCircle: '<svg class="step-status-icon failed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        skipCircle: '<svg class="step-status-icon skipped" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
        copy: '<svg class="bdd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        check: '<svg class="bdd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        tag: '<svg class="bdd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
        attachment: '<svg class="bdd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>',
        clock: '<svg class="bdd-icon bdd-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        alertTriangle: '<svg class="bdd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        fileText: '<svg class="bdd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        fileImage: '<svg class="bdd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        code: '<svg class="bdd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
        search: '<svg class="bdd-icon search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
        x: '<svg class="bdd-icon bdd-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
    };

    // DOM Elements Cache
    const elements = {
        root: document.getElementById('bdd-report-root'),
        loadingState: document.getElementById('bdd-loading-state'),
        errorState: document.getElementById('bdd-error-state'),
        errorMessage: document.getElementById('bdd-error-message'),
        contentArea: document.getElementById('bdd-content-area'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        fullscreenToggleBtn: document.getElementById('fullscreen-toggle-btn'),
        downloadJsonBtn: document.getElementById('download-json-btn'),

        // Metrics
        metricTotalScenarios: document.getElementById('metric-total-scenarios'),
        metricPassedScenarios: document.getElementById('metric-passed-scenarios'),
        metricFailedScenarios: document.getElementById('metric-failed-scenarios'),
        metricSkippedScenarios: document.getElementById('metric-skipped-scenarios'),
        metricPassedSteps: document.getElementById('metric-passed-steps'),
        metricFailedSteps: document.getElementById('metric-failed-steps'),
        metricSkippedSteps: document.getElementById('metric-skipped-steps'),
        metricTotalDuration: document.getElementById('metric-total-duration'),
        metricTotalFeatures: document.getElementById('metric-total-features'),
        metricPassRate: document.getElementById('metric-pass-rate'),
        progressPassed: document.getElementById('progress-passed-bar'),
        progressFailed: document.getElementById('progress-failed-bar'),
        progressSkipped: document.getElementById('progress-skipped-bar'),
        attachmentsCountBadge: document.getElementById('attachments-count-badge'),

        // Filter Counts on Toolbar
        countAll: document.getElementById('filter-count-all'),
        countFailed: document.getElementById('filter-count-failed'),
        countPassed: document.getElementById('filter-count-passed'),
        countSkipped: document.getElementById('filter-count-skipped'),

        // Tabs
        tabButtons: document.querySelectorAll('.bdd-tab-btn'),
        tabPanes: document.querySelectorAll('.bdd-tab-pane'),

        // Toolbar
        searchInput: document.getElementById('bdd-search-input'),
        searchClear: document.getElementById('bdd-search-clear'),
        filterButtons: document.querySelectorAll('.bdd-filter-btn'),
        expandAllBtn: document.getElementById('expand-all-btn'),
        collapseAllBtn: document.getElementById('collapse-all-btn'),

        // Scalable Tag Popover & Active Bar
        tagDropdownBtn: document.getElementById('bdd-tag-dropdown-btn'),
        tagPopover: document.getElementById('bdd-tag-popover'),
        tagPopoverSearch: document.getElementById('tag-popover-search'),
        tagPopoverList: document.getElementById('tag-popover-list'),
        tagSelectAllBtn: document.getElementById('tag-select-all-btn'),
        tagClearAllBtn: document.getElementById('tag-clear-all-btn'),
        activeTagsBar: document.getElementById('bdd-active-tags-bar'),
        activeTagsList: document.getElementById('bdd-active-tags-list'),
        clearAllActiveTagsBtn: document.getElementById('clear-all-active-tags-btn'),

        featuresContainer: document.getElementById('bdd-features-container'),

        // Explorer
        explorerSearchInput: document.getElementById('explorer-search-input'),
        explorerTreeContent: document.getElementById('explorer-tree-content'),
        viewerAttachmentTitle: document.getElementById('viewer-attachment-title'),
        viewerAttachmentDetails: document.getElementById('viewer-attachment-details'),
        viewerActions: document.getElementById('viewer-actions'),
        viewerCopyBtn: document.getElementById('viewer-copy-btn'),
        viewerDownloadLink: document.getElementById('viewer-download-link'),
        viewerContentBody: document.getElementById('viewer-content-body'),

        // Toast
        toast: document.getElementById('bdd-toast')
    };

    /**
     * Entrypoint
     */
    function init() {
        if (!elements.root) return;

        // Theme init
        const savedTheme = localStorage.getItem('bdd_report_theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            enableTheme(true);
        } else {
            enableTheme(false);
        }

        // Configuration
        const reportUrl = elements.root.getAttribute('data-report-url');
        state.attachmentUrlBase = elements.root.getAttribute('data-attachment-url') || '';
        state.downloadUrlBase = elements.root.getAttribute('data-download-url') || '';

        bindGlobalEvents();

        if (reportUrl) {
            fetchReportData(reportUrl);
        } else {
            showError('Report data URL is missing.');
        }
    }

    /**
     * Fetch Report Data
     */
    function fetchReportData(url) {
        fetch(url)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return response.json();
            })
            .then(function (payload) {
                if (!payload || !payload.features) {
                    throw new Error('Report payload is empty or invalid.');
                }
                state.payload = payload;
                state.features = normalizePayload(payload.features);
                state.summary = recalculateSummary(state.features, payload.summary);
                renderReport();
            })
            .catch(function (error) {
                console.error('[BDD Report] Fetch error:', error);
                showError(error.message);
            });
    }

    /**
     * Normalizes payload and strictly calculates statuses:
     * - Any failed step/hook -> scenario is failed
     * - Any skipped step/hook (and 0 failed) -> scenario is skipped
     * - All passed -> scenario is passed
     * - Any failed scenario -> feature is failed
     */
    function normalizePayload(features) {
        return (features || []).map(function (feature) {
            const scenarios = (feature.scenarios || []).map(function (scenario) {
                let computedStatus = 'passed';
                let hasFailedStep = false;
                let hasSkippedStep = false;
                let totalDuration = 0;

                const allStepsAndHooks = [
                    ...(scenario.beforeHooks || []),
                    ...(scenario.steps || []),
                    ...(scenario.afterHooks || [])
                ];

                allStepsAndHooks.forEach(function (step) {
                    const st = (step.status || '').toLowerCase();
                    totalDuration += (step.duration || 0);

                    if (st === 'failed') {
                        hasFailedStep = true;
                    } else if (st === 'skipped' || st === 'pending' || st === 'undefined') {
                        hasSkippedStep = true;
                    }
                });

                if (hasFailedStep) {
                    computedStatus = 'failed';
                } else if (hasSkippedStep) {
                    computedStatus = 'skipped';
                } else if (allStepsAndHooks.length === 0) {
                    computedStatus = (scenario.status || 'passed').toLowerCase();
                }

                return Object.assign({}, scenario, {
                    status: computedStatus,
                    duration: scenario.duration || totalDuration
                });
            });

            // Feature status
            let featureStatus = 'passed';
            let hasFailedScenario = scenarios.some(function (s) { return s.status === 'failed'; });
            let hasSkippedScenario = scenarios.some(function (s) { return s.status === 'skipped'; });

            if (hasFailedScenario) {
                featureStatus = 'failed';
            } else if (hasSkippedScenario) {
                featureStatus = 'skipped';
            }

            return Object.assign({}, feature, {
                status: featureStatus,
                scenarios: scenarios
            });
        });
    }

    /**
     * Recalculates metrics summary from normalized features
     */
    function recalculateSummary(features, initialSummary) {
        let totalScenarios = 0;
        let passedScenarios = 0;
        let failedScenarios = 0;
        let skippedScenarios = 0;
        let passedSteps = 0;
        let failedSteps = 0;
        let skippedSteps = 0;
        let totalDuration = 0;
        let totalAttachments = 0;
        const tagMap = new Map();

        features.forEach(function (f) {
            (f.scenarios || []).forEach(function (s) {
                totalScenarios++;
                if (s.status === 'failed') failedScenarios++;
                else if (s.status === 'passed') passedScenarios++;
                else if (s.status === 'skipped') skippedScenarios++;

                totalDuration += (s.duration || 0);

                (s.tags || []).forEach(function (t) {
                    tagMap.set(t, (tagMap.get(t) || 0) + 1);
                });

                (s.steps || []).forEach(function (step) {
                    const st = (step.status || '').toLowerCase();
                    if (st === 'passed') passedSteps++;
                    else if (st === 'failed') failedSteps++;
                    else if (st === 'skipped' || st === 'pending' || st === 'undefined') skippedSteps++;

                    if (step.attachments) {
                        totalAttachments += step.attachments.length;
                    }
                });
            });
        });

        const passPercentage = totalScenarios > 0
            ? Math.round(((passedScenarios / totalScenarios) * 100) * 10) / 10
            : 100;

        return {
            totalFeatures: features.length,
            totalScenarios: totalScenarios,
            passedScenarios: passedScenarios,
            failedScenarios: failedScenarios,
            skippedScenarios: skippedScenarios,
            passedSteps: passedSteps,
            failedSteps: failedSteps,
            skippedSteps: skippedSteps,
            totalDuration: totalDuration,
            formattedDuration: formatNanos(totalDuration),
            passPercentage: passPercentage,
            totalAttachments: totalAttachments,
            tagCounts: tagMap,
            allTags: Array.from(tagMap.keys()).sort()
        };
    }

    /**
     * Render entire report view
     */
    function renderReport() {
        if (elements.loadingState) elements.loadingState.style.display = 'none';
        if (elements.errorState) elements.errorState.style.display = 'none';
        if (elements.contentArea) elements.contentArea.style.display = 'block';

        renderSummaryMetrics();
        renderTagPopover();
        renderActiveTagsBar();
        renderFeaturesTree();
        renderExplorerTree();
    }

    /**
     * Render Executive KPI Summary Cards
     */
    function renderSummaryMetrics() {
        const s = state.summary;
        if (!s) return;

        if (elements.metricTotalScenarios) elements.metricTotalScenarios.textContent = s.totalScenarios;
        if (elements.metricPassedScenarios) elements.metricPassedScenarios.textContent = s.passedScenarios;
        if (elements.metricFailedScenarios) elements.metricFailedScenarios.textContent = s.failedScenarios;
        if (elements.metricSkippedScenarios) elements.metricSkippedScenarios.textContent = s.skippedScenarios;

        if (elements.metricPassedSteps) elements.metricPassedSteps.textContent = s.passedSteps + ' steps';
        if (elements.metricFailedSteps) elements.metricFailedSteps.textContent = s.failedSteps + ' steps';
        if (elements.metricSkippedSteps) elements.metricSkippedSteps.textContent = s.skippedSteps + ' steps';

        if (elements.metricTotalDuration) {
            elements.metricTotalDuration.innerHTML = `${ICONS.clock} <span>${s.formattedDuration}</span>`;
        }
        if (elements.metricTotalFeatures) elements.metricTotalFeatures.textContent = s.totalFeatures + ' features';

        if (elements.metricPassRate) {
            elements.metricPassRate.textContent = s.passPercentage + '% Pass Rate';
            elements.metricPassRate.className = 'metric-rate-badge ' +
                (s.passPercentage >= 90 ? 'rate-success' : (s.passPercentage >= 60 ? 'rate-warning' : 'rate-danger'));
        }

        // Progress bar segments
        const total = s.totalScenarios || 1;
        if (elements.progressPassed) elements.progressPassed.style.width = ((s.passedScenarios / total) * 100) + '%';
        if (elements.progressFailed) elements.progressFailed.style.width = ((s.failedScenarios / total) * 100) + '%';
        if (elements.progressSkipped) elements.progressSkipped.style.width = ((s.skippedScenarios / total) * 100) + '%';

        // Filter button counts
        if (elements.countAll) elements.countAll.textContent = s.totalScenarios;
        if (elements.countFailed) elements.countFailed.textContent = s.failedScenarios;
        if (elements.countPassed) elements.countPassed.textContent = s.passedScenarios;
        if (elements.countSkipped) elements.countSkipped.textContent = s.skippedScenarios;

        if (elements.attachmentsCountBadge) elements.attachmentsCountBadge.textContent = s.totalAttachments;
    }

    /**
     * Render Scalable Tag Popover Dropdown (Supports N tags)
     */
    function renderTagPopover() {
        if (!elements.tagPopoverList) return;

        const allTags = state.summary.allTags || [];
        const filter = (state.tagSearchTerm || '').toLowerCase().trim();
        const tagCounts = state.summary.tagCounts || new Map();

        elements.tagPopoverList.innerHTML = '';

        const visibleTags = allTags.filter(function (t) {
            return !filter || t.toLowerCase().includes(filter);
        });

        if (visibleTags.length === 0) {
            elements.tagPopoverList.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--bdd-text-muted);font-size:0.75rem;">No matching tags</div>';
            return;
        }

        visibleTags.forEach(function (tag) {
            const isChecked = state.activeTags.has(tag);
            const count = tagCounts.get(tag) || 0;

            const item = document.createElement('label');
            item.className = 'tag-popover-item';

            const left = document.createElement('div');
            left.className = 'tag-item-left';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = isChecked;

            const name = document.createElement('span');
            name.textContent = tag;

            left.appendChild(checkbox);
            left.appendChild(name);

            const countBadge = document.createElement('span');
            countBadge.className = 'tag-item-count';
            countBadge.textContent = count;

            item.appendChild(left);
            item.appendChild(countBadge);

            checkbox.addEventListener('change', function () {
                if (checkbox.checked) {
                    state.activeTags.add(tag);
                } else {
                    state.activeTags.delete(tag);
                }
                updateTagControlState();
                renderActiveTagsBar();
                renderFeaturesTree();
            });

            elements.tagPopoverList.appendChild(item);
        });

        updateTagControlState();
    }

    /**
     * Update tag dropdown button indicator
     */
    function updateTagControlState() {
        if (!elements.tagDropdownBtn) return;
        const count = state.activeTags.size;
        const total = (state.summary.allTags || []).length;

        if (count > 0) {
            elements.tagDropdownBtn.classList.add('has-active');
            elements.tagDropdownBtn.innerHTML = `${ICONS.tag} <span>Tags</span> <span class="tag-count-badge">${count}/${total}</span> ${ICONS.chevronDown}`;
        } else {
            elements.tagDropdownBtn.classList.remove('has-active');
            elements.tagDropdownBtn.innerHTML = `${ICONS.tag} <span>Tags</span> <span class="tag-count-badge">${total}</span> ${ICONS.chevronDown}`;
        }
    }

    /**
     * Render Active Tags Bar below Toolbar
     */
    function renderActiveTagsBar() {
        if (!elements.activeTagsBar || !elements.activeTagsList) return;

        elements.activeTagsList.innerHTML = '';

        if (state.activeTags.size === 0) {
            elements.activeTagsBar.classList.remove('has-tags');
            return;
        }

        elements.activeTagsBar.classList.add('has-tags');

        state.activeTags.forEach(function (tag) {
            const chip = document.createElement('span');
            chip.className = 'bdd-active-tag-chip';
            chip.innerHTML = `${escapeHtml(tag)} <span class="remove-tag" title="Remove tag">${ICONS.x}</span>`;

            chip.querySelector('.remove-tag').addEventListener('click', function () {
                state.activeTags.delete(tag);
                renderTagPopover();
                renderActiveTagsBar();
                renderFeaturesTree();
            });

            elements.activeTagsList.appendChild(chip);
        });
    }

    /**
     * Render Collapsible Features & Scenarios Tree
     */
    function renderFeaturesTree() {
        const container = elements.featuresContainer;
        if (!container) return;
        container.innerHTML = '';

        const filterTerm = state.searchTerm.toLowerCase().trim();
        let totalVisibleFeatures = 0;
        let totalVisibleScenarios = 0;

        state.features.forEach(function (feature, fIdx) {
            // Filter scenarios under this feature
            const matchingScenarios = (feature.scenarios || []).filter(function (scenario) {
                // Status Filter
                if (state.statusFilter !== 'all') {
                    if (scenario.status !== state.statusFilter) {
                        return false;
                    }
                }

                // Tag Filter (Multi-select OR matching)
                if (state.activeTags.size > 0) {
                    const scenarioTags = new Set(scenario.tags || []);
                    let hasMatchingTag = false;
                    state.activeTags.forEach(function (t) {
                        if (scenarioTags.has(t)) hasMatchingTag = true;
                    });
                    if (!hasMatchingTag) return false;
                }

                // Text Search Filter
                if (filterTerm) {
                    const inFeature = (feature.name || '').toLowerCase().includes(filterTerm);
                    const inScenario = (scenario.name || '').toLowerCase().includes(filterTerm);
                    const inSteps = (scenario.steps || []).some(function (step) {
                        return (step.name || '').toLowerCase().includes(filterTerm) ||
                            (step.keyword || '').toLowerCase().includes(filterTerm) ||
                            (step.errorMessage || '').toLowerCase().includes(filterTerm);
                    });
                    const inTags = (scenario.tags || []).some(function (t) {
                        return t.toLowerCase().includes(filterTerm);
                    });
                    return inFeature || inScenario || inSteps || inTags;
                }

                return true;
            });

            if (matchingScenarios.length === 0) {
                return;
            }

            totalVisibleFeatures++;
            totalVisibleScenarios += matchingScenarios.length;

            // Feature Card DOM
            const featureCard = document.createElement('div');
            const hasFailed = feature.status === 'failed';
            // Failed features start expanded; passed start collapsed
            featureCard.className = 'bdd-feature-card status-' + feature.status + (hasFailed ? ' expanded' : '');

            // Feature Header
            const header = document.createElement('div');
            header.className = 'feature-header';
            header.innerHTML = `
                <div class="feature-title-area">
                    ${ICONS.chevron}
                    <span class="keyword-badge">${escapeHtml(feature.keyword || 'Feature')}</span>
                    <span class="feature-name">${escapeHtml(feature.name)}</span>
                </div>
                <div class="feature-meta">
                    <span class="feature-stats-pill">${matchingScenarios.length} of ${feature.scenarios.length} scenarios</span>
                    <span class="status-pill status-${feature.status}">${feature.status}</span>
                    <span class="duration-pill">${ICONS.clock} ${formatNanos(feature.duration)}</span>
                </div>
            `;
            header.addEventListener('click', function () {
                featureCard.classList.toggle('expanded');
            });
            featureCard.appendChild(header);

            // Feature Body
            const body = document.createElement('div');
            body.className = 'feature-body';

            if (feature.description && feature.description.trim()) {
                const desc = document.createElement('div');
                desc.className = 'feature-description';
                desc.textContent = feature.description;
                body.appendChild(desc);
            }

            // Render Scenarios
            matchingScenarios.forEach(function (scenario, sIdx) {
                const scenarioCard = renderScenarioCard(scenario, fIdx, sIdx);
                body.appendChild(scenarioCard);
            });

            featureCard.appendChild(body);
            container.appendChild(featureCard);
        });

        if (totalVisibleScenarios === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:2.5rem 1rem;background:var(--bdd-bg-card);border:1px solid var(--bdd-border);border-radius:var(--bdd-radius-md);">
                    <div style="margin-bottom:0.5rem;color:var(--bdd-text-muted);">${ICONS.search}</div>
                    <p style="font-size:0.875rem;font-weight:600;color:var(--bdd-text-main);margin:0 0 0.25rem 0;">No matching scenarios</p>
                    <p style="font-size:0.75rem;color:var(--bdd-text-muted);margin:0;">Try adjusting your status, search, or tag filters.</p>
                </div>
            `;
        }
    }

    /**
     * Render Scenario Card DOM
     */
    function renderScenarioCard(scenario, fIdx, sIdx) {
        const scenarioCard = document.createElement('div');
        const isFailed = scenario.status === 'failed';
        // Auto-expand failed scenario on load for fast debugging
        scenarioCard.className = 'bdd-scenario-card status-' + scenario.status + (isFailed ? ' expanded' : '');

        // Header
        const header = document.createElement('div');
        header.className = 'scenario-header';

        const tagsHtml = (scenario.tags || []).map(function (t) {
            return `<span class="scenario-tag">${escapeHtml(t)}</span>`;
        }).join('');

        header.innerHTML = `
            <div class="scenario-title-area">
                ${ICONS.chevron}
                <span class="keyword-badge">${escapeHtml(scenario.keyword || 'Scenario')}</span>
                <span class="scenario-name">${escapeHtml(scenario.name)}</span>
            </div>
            <div class="scenario-meta">
                <div class="scenario-tags">${tagsHtml}</div>
                <span class="status-pill status-${scenario.status}">${scenario.status}</span>
                <span class="duration-pill">${formatNanos(scenario.duration)}</span>
            </div>
        `;
        header.addEventListener('click', function () {
            scenarioCard.classList.toggle('expanded');
        });
        scenarioCard.appendChild(header);

        // Body
        const body = document.createElement('div');
        body.className = 'scenario-body';

        const stepsList = document.createElement('div');
        stepsList.className = 'scenario-steps-list';

        // Render Before Hooks
        (scenario.beforeHooks || []).forEach(function (hook) {
            if (hook.status === 'failed' || (hook.attachments && hook.attachments.length > 0)) {
                stepsList.appendChild(renderHookRow(hook, 'Before Hook'));
            }
        });

        // Render Steps
        (scenario.steps || []).forEach(function (step) {
            stepsList.appendChild(renderStepRow(step));
        });

        // Render After Hooks
        (scenario.afterHooks || []).forEach(function (hook) {
            if (hook.status === 'failed' || (hook.attachments && hook.attachments.length > 0)) {
                stepsList.appendChild(renderHookRow(hook, 'After Hook'));
            }
        });

        body.appendChild(stepsList);
        scenarioCard.appendChild(body);
        return scenarioCard;
    }

    /**
     * Render Step Row DOM
     */
    function renderStepRow(step) {
        const stepContainer = document.createElement('div');
        stepContainer.className = 'step-execution-block';

        const row = document.createElement('div');
        const st = (step.status || 'passed').toLowerCase();
        row.className = 'bdd-step-row status-' + st;

        let iconSvg = ICONS.checkCircle;
        if (st === 'failed') iconSvg = ICONS.crossCircle;
        else if (st === 'skipped' || st === 'pending' || st === 'undefined') iconSvg = ICONS.skipCircle;

        const kw = (step.keyword || '').trim();
        const kwClass = 'keyword-' + (kw.toLowerCase() || 'given');

        const isSlow = (step.duration || 0) >= 5000000000; // >= 5s

        row.innerHTML = `
            <div class="step-left">
                ${iconSvg}
                <span class="step-keyword ${kwClass}">${escapeHtml(kw || 'STEP')}</span>
                <span class="step-name">${formatStepText(step.name || '')}</span>
            </div>
            <div class="step-right">
                ${isSlow ? '<span class="step-slow-badge" title="Bottleneck: Step took >= 5.0s">' + ICONS.clock + ' ' + formatNanos(step.duration) + ' (slow)</span>' : ''}
                <span class="step-duration">${formatNanos(step.duration)}</span>
            </div>
        `;
        stepContainer.appendChild(row);

        // Data Table
        if (step.rows && step.rows.length > 0) {
            const table = document.createElement('table');
            table.className = 'bdd-data-table';
            step.rows.forEach(function (rowObj, rIdx) {
                const tr = document.createElement('tr');
                (rowObj.cells || []).forEach(function (cell) {
                    const el = rIdx === 0 ? document.createElement('th') : document.createElement('td');
                    el.textContent = cell;
                    tr.appendChild(el);
                });
                table.appendChild(tr);
            });
            stepContainer.appendChild(table);
        }

        // Error Stack Trace Terminal
        if (st === 'failed' && (step.errorMessage || step.errorStackTrace)) {
            const traceText = step.errorStackTrace || step.errorMessage;
            const errorBox = document.createElement('div');
            errorBox.className = 'bdd-error-box';
            errorBox.innerHTML = `
                <div class="error-box-header">
                    <div class="error-header-title">
                        ${ICONS.alertTriangle}
                        <span>${escapeHtml(step.errorMessage || 'Step Failure')}</span>
                    </div>
                    <button class="copy-error-btn" title="Copy Error Stack Trace">
                        ${ICONS.copy}
                        <span>Copy Trace</span>
                    </button>
                </div>
                <pre class="error-stack-trace">${escapeHtml(traceText)}</pre>
            `;
            const copyBtn = errorBox.querySelector('.copy-error-btn');
            copyBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                copyToClipboard(traceText);
                copyBtn.innerHTML = `${ICONS.check} <span>Copied!</span>`;
                setTimeout(function () {
                    copyBtn.innerHTML = `${ICONS.copy} <span>Copy Trace</span>`;
                }, 2000);
            });
            stepContainer.appendChild(errorBox);
        }

        // Attachments
        if (step.attachments && step.attachments.length > 0) {
            const attStrip = document.createElement('div');
            attStrip.className = 'step-attachments-strip';
            step.attachments.forEach(function (att) {
                const pill = document.createElement('button');
                pill.className = 'step-attachment-pill';
                const mime = (att.mimeType || '').toLowerCase();
                let attIcon = ICONS.fileText;
                if (mime.startsWith('image/')) attIcon = ICONS.fileImage;
                else if (mime.includes('json') || mime.includes('xml')) attIcon = ICONS.code;

                pill.innerHTML = `${attIcon} <span>${escapeHtml(att.name || 'Attachment')}</span> <span style="opacity:0.6">(${formatBytes(att.sizeBytes)})</span>`;
                pill.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openAttachmentInViewer(att);
                });
                attStrip.appendChild(pill);
            });
            stepContainer.appendChild(attStrip);
        }

        return stepContainer;
    }

    /**
     * Render Hook Row
     */
    function renderHookRow(hook, label) {
        const step = {
            keyword: label,
            name: hook.location || label,
            status: hook.status,
            duration: hook.duration,
            errorMessage: hook.errorMessage,
            errorStackTrace: hook.errorStackTrace,
            attachments: hook.attachments
        };
        return renderStepRow(step);
    }

    /**
     * Format step text with inline code blocks for strings and numbers
     */
    function formatStepText(text) {
        if (!text) return '';
        const escaped = escapeHtml(text);
        return escaped.replace(/(&quot;.*?&quot;|&apos;.*?&apos;|".*?"|'.*?'|\b\d+\b)/g, '<code>$1</code>');
    }

    /**
     * Render Debug & Attachments Explorer Tree
     */
    function renderExplorerTree() {
        if (!elements.explorerTreeContent) return;
        const filter = (elements.explorerSearchInput ? elements.explorerSearchInput.value : '').toLowerCase().trim();
        elements.explorerTreeContent.innerHTML = '';

        let totalFound = 0;

        state.features.forEach(function (feature) {
            (feature.scenarios || []).forEach(function (scenario) {
                const attachments = [];

                (scenario.beforeHooks || []).forEach(function (h) {
                    if (h.attachments) attachments.push(...h.attachments);
                });
                (scenario.steps || []).forEach(function (s) {
                    if (s.attachments) attachments.push(...s.attachments);
                });
                (scenario.afterHooks || []).forEach(function (h) {
                    if (h.attachments) attachments.push(...h.attachments);
                });

                const matchingAtts = attachments.filter(function (att) {
                    return !filter ||
                        (att.name || '').toLowerCase().includes(filter) ||
                        (scenario.name || '').toLowerCase().includes(filter) ||
                        (feature.name || '').toLowerCase().includes(filter);
                });

                if (matchingAtts.length === 0) return;

                totalFound += matchingAtts.length;

                const group = document.createElement('div');
                group.className = 'tree-node-group';
                group.innerHTML = `<div class="tree-group-title">${ICONS.chevron} <span>${escapeHtml(scenario.name)}</span></div>`;

                matchingAtts.forEach(function (att) {
                    const item = document.createElement('div');
                    item.className = 'tree-item-attachment' + (state.selectedAttachment === att ? ' selected' : '');
                    const mime = (att.mimeType || '').toLowerCase();
                    let attIcon = ICONS.fileText;
                    if (mime.startsWith('image/')) attIcon = ICONS.fileImage;
                    else if (mime.includes('json') || mime.includes('xml')) attIcon = ICONS.code;

                    item.innerHTML = `
                        <div style="display:flex;align-items:center;gap:0.35rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                            ${attIcon}
                            <span>${escapeHtml(att.name || 'Attachment')}</span>
                        </div>
                        <span style="font-size:0.65rem;opacity:0.6;">${formatBytes(att.sizeBytes)}</span>
                    `;
                    item.addEventListener('click', function () {
                        document.querySelectorAll('.tree-item-attachment').forEach(function (el) { el.classList.remove('selected'); });
                        item.classList.add('selected');
                        viewAttachmentDetails(att);
                    });
                    group.appendChild(item);
                });

                elements.explorerTreeContent.appendChild(group);
            });
        });

        if (totalFound === 0) {
            elements.explorerTreeContent.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--bdd-text-muted);font-size:0.75rem;">No attachments found</div>';
        }
    }

    /**
     * View attachment in the right panel of the Explorer
     */
    function viewAttachmentDetails(att) {
        state.selectedAttachment = att;
        if (!elements.viewerContentBody) return;

        if (elements.viewerAttachmentTitle) elements.viewerAttachmentTitle.textContent = att.name || 'Attachment';
        if (elements.viewerAttachmentDetails) {
            elements.viewerAttachmentDetails.textContent = `${att.mimeType || 'unknown'} • ${formatBytes(att.sizeBytes)}`;
        }
        if (elements.viewerActions) elements.viewerActions.style.display = 'flex';

        elements.viewerContentBody.innerHTML = '';

        const mime = (att.mimeType || '').toLowerCase();
        let contentData = att.data || '';

        // If externalized, fetch on demand
        if (att.external && att.id) {
            elements.viewerContentBody.innerHTML = '<div class="bdd-spinner"></div>';
            const attUrl = (state.attachmentUrlBase || '') + 'attachment?id=' + encodeURIComponent(att.id);
            fetch(attUrl)
                .then(function (res) { return res.text(); })
                .then(function (data) {
                    renderAttachmentPayload(mime, data);
                })
                .catch(function (err) {
                    elements.viewerContentBody.innerHTML = `<p style="color:var(--bdd-fail);">${ICONS.alertTriangle} Failed to stream attachment: ${escapeHtml(err.message)}</p>`;
                });
            return;
        }

        renderAttachmentPayload(mime, contentData);
    }

    function renderAttachmentPayload(mime, content) {
        if (mime.startsWith('image/')) {
            const img = document.createElement('img');
            img.className = 'viewer-image-preview';
            img.src = content.startsWith('data:') ? content : ('data:' + mime + ';base64,' + content);
            img.alt = 'Attachment Preview';
            elements.viewerContentBody.appendChild(img);
        } else {
            const pre = document.createElement('pre');
            pre.className = 'viewer-text-preview';
            pre.textContent = content;
            elements.viewerContentBody.appendChild(pre);
        }

        // Configure copy button
        if (elements.viewerCopyBtn) {
            elements.viewerCopyBtn.onclick = function () {
                copyToClipboard(content);
                showToast('Attachment content copied to clipboard');
            };
        }
    }

    /**
     * Direct jump from step attachment to explorer
     */
    function openAttachmentInViewer(att) {
        switchTab('attachments-tab');
        viewAttachmentDetails(att);
        renderExplorerTree();
    }

    /**
     * Switch Active Navigation Tab
     */
    function switchTab(tabId) {
        state.activeTab = tabId;
        elements.tabButtons.forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });
        elements.tabPanes.forEach(function (pane) {
            pane.classList.toggle('active', pane.id === tabId);
        });
    }

    /**
     * Global Event Listeners
     */
    function bindGlobalEvents() {
        // Theme toggle
        if (elements.themeToggleBtn) {
            elements.themeToggleBtn.addEventListener('click', function () {
                enableTheme(!state.isDarkTheme);
            });
        }

        // Fullscreen toggle
        if (elements.fullscreenToggleBtn) {
            elements.fullscreenToggleBtn.addEventListener('click', function () {
                state.isFullscreen = !state.isFullscreen;
                elements.root.classList.toggle('fullscreen', state.isFullscreen);
            });
        }

        // Tabs
        elements.tabButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                switchTab(btn.getAttribute('data-tab'));
            });
        });

        // Search Input
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', function (e) {
                state.searchTerm = e.target.value;
                if (elements.searchClear) {
                    elements.searchClear.style.display = state.searchTerm ? 'flex' : 'none';
                }
                renderFeaturesTree();
            });
        }
        if (elements.searchClear) {
            elements.searchClear.addEventListener('click', function () {
                state.searchTerm = '';
                elements.searchInput.value = '';
                elements.searchClear.style.display = 'none';
                renderFeaturesTree();
            });
        }

        // Status Segmented Filter
        elements.filterButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                elements.filterButtons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                state.statusFilter = btn.getAttribute('data-filter') || 'all';
                renderFeaturesTree();
            });
        });

        // Tag Popover Toggle
        if (elements.tagDropdownBtn && elements.tagPopover) {
            elements.tagDropdownBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                state.tagPopoverOpen = !state.tagPopoverOpen;
                elements.tagPopover.classList.toggle('open', state.tagPopoverOpen);
            });

            document.addEventListener('click', function (e) {
                if (state.tagPopoverOpen && !elements.tagPopover.contains(e.target) && e.target !== elements.tagDropdownBtn) {
                    state.tagPopoverOpen = false;
                    elements.tagPopover.classList.remove('open');
                }
            });
        }

        // Tag Popover Search
        if (elements.tagPopoverSearch) {
            elements.tagPopoverSearch.addEventListener('input', function (e) {
                state.tagSearchTerm = e.target.value;
                renderTagPopover();
            });
        }

        // Select All / Clear All Tags
        if (elements.tagSelectAllBtn) {
            elements.tagSelectAllBtn.addEventListener('click', function () {
                (state.summary.allTags || []).forEach(function (t) { state.activeTags.add(t); });
                renderTagPopover();
                renderActiveTagsBar();
                renderFeaturesTree();
            });
        }
        if (elements.tagClearAllBtn) {
            elements.tagClearAllBtn.addEventListener('click', function () {
                state.activeTags.clear();
                renderTagPopover();
                renderActiveTagsBar();
                renderFeaturesTree();
            });
        }
        if (elements.clearAllActiveTagsBtn) {
            elements.clearAllActiveTagsBtn.addEventListener('click', function () {
                state.activeTags.clear();
                renderTagPopover();
                renderActiveTagsBar();
                renderFeaturesTree();
            });
        }

        // Expand / Collapse All
        if (elements.expandAllBtn) {
            elements.expandAllBtn.addEventListener('click', function () {
                document.querySelectorAll('.bdd-feature-card').forEach(function (c) { c.classList.add('expanded'); });
                document.querySelectorAll('.bdd-scenario-card').forEach(function (c) { c.classList.add('expanded'); });
            });
        }
        if (elements.collapseAllBtn) {
            elements.collapseAllBtn.addEventListener('click', function () {
                document.querySelectorAll('.bdd-feature-card').forEach(function (c) { c.classList.remove('expanded'); });
                document.querySelectorAll('.bdd-scenario-card').forEach(function (c) { c.classList.remove('expanded'); });
            });
        }

        // Explorer search
        if (elements.explorerSearchInput) {
            elements.explorerSearchInput.addEventListener('input', function () {
                renderExplorerTree();
            });
        }

        // Keyboard Shortcut: '/' to focus search
        document.addEventListener('keydown', function (e) {
            if (e.key === '/' && document.activeElement !== elements.searchInput && document.activeElement !== elements.explorerSearchInput && document.activeElement !== elements.tagPopoverSearch) {
                e.preventDefault();
                if (elements.searchInput) elements.searchInput.focus();
            }
        });
    }

    /**
     * Theme switcher
     */
    function enableTheme(isDark) {
        state.isDarkTheme = isDark;
        if (isDark) {
            elements.root.setAttribute('data-theme', 'dark');
            elements.root.classList.add('dark-theme');
            localStorage.setItem('bdd_report_theme', 'dark');
        } else {
            elements.root.setAttribute('data-theme', 'light');
            elements.root.classList.remove('dark-theme');
            localStorage.setItem('bdd_report_theme', 'light');
        }
    }

    /**
     * Copy to clipboard helper
     */
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                showToast('Copied to clipboard');
            }).catch(function () {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('Copied to clipboard');
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textarea);
    }

    function showToast(msg) {
        if (!elements.toast) return;
        elements.toast.innerHTML = `${ICONS.check} <span>${escapeHtml(msg)}</span>`;
        elements.toast.style.display = 'flex';
        setTimeout(function () {
            elements.toast.style.display = 'none';
        }, 2500);
    }

    function showError(msg) {
        if (elements.loadingState) elements.loadingState.style.display = 'none';
        if (elements.errorState) elements.errorState.style.display = 'block';
        if (elements.errorMessage) elements.errorMessage.textContent = msg;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/&lt;/g, '&lt;')
            .replace(/&gt;/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatNanos(nanos) {
        if (!nanos || nanos <= 0) return '0ms';
        const millis = nanos / 1000000;
        if (millis < 1000) {
            return Math.round(millis) + 'ms';
        }
        const seconds = millis / 1000;
        if (seconds < 60) {
            return seconds.toFixed(2) + 's';
        }
        const minutes = Math.floor(seconds / 60);
        const remSecs = (seconds % 60).toFixed(1);
        return minutes + 'm ' + remSecs + 's';
    }

    function formatBytes(bytes) {
        if (!bytes || bytes <= 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
