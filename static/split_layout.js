/**
 * 第七期任务496：左右分屏布局交互
 * 严格按照产品原型SVG实现
 */

// ===== 全局状态 =====
const SplitLayoutState = {
    // 布局模式: 'split' 左右分屏, 'stack' 上下堆叠
    layoutMode: 'split',
    
    // 分屏比例 (0-1, 表示左侧宽度占比)
    splitRatio: 0.5,
    
    // 是否正在拖动
    isDragging: false,
    
    // 支持的预设比例
    presetRatios: [
        { value: 0.5, label: '50/50' },
        { value: 0.6, label: '60/40' },
        { value: 0.7, label: '70/30' }
    ],
    
    // 编辑器状态
    editor: {
        input: '',
        output: ''
    },
    
    // UI状态
    ui: {
        showStorageStatus: true,
        // 新增：移动端检测状态
        isMobile: false,
        // 新增：自动调整输出区高度
        autoAdjustOutputHeight: true
    },
    
    // 新增：区域高度设置
    areaHeights: {
        input: {
            min: 300,  // 最小高度 (px)
            max: 600,  // 最大高度 (px)
            default: 400 // 默认高度 (px)
        },
        output: {
            min: 200,  // 最小高度 (px)
            max: 600,  // 最大高度 (px)
            auto: true // 是否自动调整高度
        }
    }
};

// ===== DOM 元素引用 =====
const DOM = {
    splitContainer: null,
    splitter: null,
    inputPanel: null,
    outputPanel: null,
    layoutToggleBtn: null,
    ratioCircles: null,
    storageStatus: null,
    
    // 编辑器元素
    jsonInput: null,
    jsonOutput: null,
    formatBtn: null,
    compressBtn: null,
    clearBtn: null,
    
    // 新增：响应式指示器元素
    responsiveIndicator: null,
    heightLimitIndicator: null,
    
    // 新增：信息显示元素
    inputInfo: null,
    outputInfo: null
};

// ===== 初始化函数 =====
function init() {
    console.log('初始化左右分屏布局...');
    
    // 获取DOM元素
    cacheDOMElements();
    
    // 加载保存的状态
    loadSavedState();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 检测移动端
    detectMobileDevice();
    
    // 应用初始状态
    applyLayoutState();
    
    // 初始化编辑器
    initEditor();
    
    // 设置区域高度
    setupAreaHeights();
    
    console.log('左右分屏布局初始化完成');
}

function cacheDOMElements() {
    DOM.splitContainer = document.getElementById('splitContainer');
    DOM.splitter = document.getElementById('splitter');
    DOM.inputPanel = document.getElementById('inputPanel');
    DOM.outputPanel = document.getElementById('outputPanel');
    DOM.layoutToggleBtn = document.getElementById('layoutToggleBtn');
    DOM.ratioCircles = document.querySelectorAll('.ratio-circle');
    DOM.storageStatus = document.getElementById('storageStatus');
    
    // 编辑器元素
    DOM.jsonInput = document.getElementById('jsonInput');
    DOM.jsonOutput = document.getElementById('jsonOutput');
    DOM.formatBtn = document.getElementById('formatBtn');
    DOM.compressBtn = document.getElementById('compressBtn');
    DOM.clearBtn = document.getElementById('clearBtn');
    
    // 新增：响应式指示器元素
    DOM.responsiveIndicator = document.getElementById('responsiveIndicator');
    DOM.heightLimitIndicator = document.getElementById('heightLimitIndicator');
    
    // 新增：信息显示元素
    const inputInfoElement = document.querySelector('.input-info');
    const outputInfoElement = document.querySelector('.output-info');
    
    DOM.inputInfo = inputInfoElement || createInfoElement('input');
    DOM.outputInfo = outputInfoElement || createInfoElement('output');
}

// 新增：创建信息显示元素
function createInfoElement(type) {
    const infoDiv = document.createElement('div');
    infoDiv.className = `${type}-info`;
    infoDiv.style.cssText = 'font-size: 10px; color: #868e96; margin-top: 5px; display: flex; justify-content: space-between;';
    
    if (type === 'input') {
        infoDiv.innerHTML = '<span>显示15-20行</span><span>区域最小高度: 300px / 最大高度: 600px</span>';
    } else {
        infoDiv.innerHTML = '<span>自动调整高度</span><span>区域最小高度: 200px / 最大高度: 600px</span>';
    }
    
    return infoDiv;
}

function loadSavedState() {
    try {
        const saved = localStorage.getItem('jsonSplitLayoutState');
        if (saved) {
            const state = JSON.parse(saved);
            
            // 应用保存的状态
            SplitLayoutState.layoutMode = state.layoutMode || SplitLayoutState.layoutMode;
            SplitLayoutState.splitRatio = state.splitRatio || SplitLayoutState.splitRatio;
            SplitLayoutState.ui.showStorageStatus = state.ui?.showStorageStatus !== false;
            SplitLayoutState.ui.autoAdjustOutputHeight = state.ui?.autoAdjustOutputHeight !== false;
            
            // 加载区域高度设置
            if (state.areaHeights) {
                if (state.areaHeights.input) {
                    SplitLayoutState.areaHeights.input = {
                        ...SplitLayoutState.areaHeights.input,
                        ...state.areaHeights.input
                    };
                }
                if (state.areaHeights.output) {
                    SplitLayoutState.areaHeights.output = {
                        ...SplitLayoutState.areaHeights.output,
                        ...state.areaHeights.output
                    };
                }
            }
            
            // 更新UI
            if (state.editor?.input) {
                DOM.jsonInput.value = state.editor.input;
                SplitLayoutState.editor.input = state.editor.input;
            }
            
            if (state.editor?.output) {
                DOM.jsonOutput.textContent = state.editor.output;
                SplitLayoutState.editor.output = state.editor.output;
            }
            
            console.log('已加载保存的状态');
        }
    } catch (error) {
        console.error('加载保存状态失败:', error);
    }
}

function saveState() {
    try {
        const stateToSave = {
            layoutMode: SplitLayoutState.layoutMode,
            splitRatio: SplitLayoutState.splitRatio,
            editor: {
                input: SplitLayoutState.editor.input,
                output: SplitLayoutState.editor.output
            },
            ui: {
                showStorageStatus: SplitLayoutState.ui.showStorageStatus,
                autoAdjustOutputHeight: SplitLayoutState.ui.autoAdjustOutputHeight
            },
            areaHeights: {
                input: SplitLayoutState.areaHeights.input,
                output: SplitLayoutState.areaHeights.output
            },
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('jsonSplitLayoutState', JSON.stringify(stateToSave));
        
        // 显示保存状态提示
        showStorageStatus();
        
    } catch (error) {
        console.error('保存状态失败:', error);
    }
}

// ===== 移动端检测 =====
function detectMobileDevice() {
    const isMobile = window.innerWidth <= 768;
    SplitLayoutState.ui.isMobile = isMobile;
    
    if (isMobile) {
        console.log('检测到移动端设备，启用移动端布局');
        // 移动端默认使用堆叠布局
        if (SplitLayoutState.layoutMode === 'split') {
            SplitLayoutState.layoutMode = 'stack';
        }
        
        // 显示移动端指示器
        if (DOM.responsiveIndicator) {
            DOM.responsiveIndicator.style.display = 'block';
        }
        
        // 调整区域高度设置
        SplitLayoutState.areaHeights.input.min = 150;
        SplitLayoutState.areaHeights.input.max = 350;
        SplitLayoutState.areaHeights.input.default = 200;
        
        SplitLayoutState.areaHeights.output.min = 150;
        SplitLayoutState.areaHeights.output.max = 300;
    }
    
    return isMobile;
}

// ===== 区域高度管理 =====
function setupAreaHeights() {
    // 设置输入区高度
    setupInputAreaHeight();
    
    // 设置输出区高度（自动调整）
    setupOutputAreaHeight();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize);
}

function setupInputAreaHeight() {
    if (!DOM.jsonInput) return;
    
    // 设置初始高度
    let inputHeight = SplitLayoutState.areaHeights.input.default;
    
    // 应用最小/最大限制
    inputHeight = Math.max(
        SplitLayoutState.areaHeights.input.min,
        Math.min(SplitLayoutState.areaHeights.input.max, inputHeight)
    );
    
    // 设置高度
    DOM.jsonInput.style.height = `${inputHeight}px`;
    
    // 更新信息显示
    updateInputAreaInfo();
}

function setupOutputAreaHeight() {
    if (!DOM.jsonOutput) return;
    
    // 计算输出区理想高度
    calculateAndSetOutputHeight();
    
    // 监听输出内容变化
    const observer = new MutationObserver(function(mutations) {
        if (SplitLayoutState.ui.autoAdjustOutputHeight) {
            calculateAndSetOutputHeight();
        }
    });
    
    observer.observe(DOM.jsonOutput, {
        characterData: true,
        childList: true,
        subtree: true
    });
    
    // 更新信息显示
    updateOutputAreaInfo();
}

function calculateAndSetOutputHeight() {
    if (!DOM.jsonOutput) return;
    
    // 获取内容高度
    const contentHeight = DOM.jsonOutput.scrollHeight;
    const lineHeight = 18; // 假设每行高度为18px
    const padding = 30; // 内边距
    
    // 计算理想高度
    let idealHeight = contentHeight + padding;
    
    // 应用最小/最大限制
    idealHeight = Math.max(
        SplitLayoutState.areaHeights.output.min,
        Math.min(SplitLayoutState.areaHeights.output.max, idealHeight)
    );
    
    // 设置高度
    DOM.jsonOutput.style.height = `${idealHeight}px`;
    
    // 更新输出区容器高度
    const outputArea = document.getElementById('outputArea');
    if (outputArea) {
        outputArea.style.minHeight = `${idealHeight + 50}px`;
    }
}

function updateInputAreaInfo() {
    if (!DOM.inputInfo) return;
    
    const info = SplitLayoutState.areaHeights.input;
    const currentHeight = DOM.jsonInput ? parseInt(DOM.jsonInput.style.height) || info.default : info.default;
    
    // 更新信息显示
    DOM.inputInfo.innerHTML = `
        <span>显示15-20行（当前: ${Math.round(currentHeight / 18)}行）</span>
        <span>区域高度限制: ${info.min}px - ${info.max}px</span>
    `;
}

function updateOutputAreaInfo() {
    if (!DOM.outputInfo) return;
    
    const info = SplitLayoutState.areaHeights.output;
    const currentHeight = DOM.jsonOutput ? parseInt(DOM.jsonOutput.style.height) || info.min : info.min;
    
    // 更新信息显示
    DOM.outputInfo.innerHTML = `
        <span>自动调整高度（当前: ${currentHeight}px）</span>
        <span>区域高度限制: ${info.min}px - ${info.max}px</span>
    `;
}

function handleResize() {
    // 重新检测移动端
    const wasMobile = SplitLayoutState.ui.isMobile;
    const isMobileNow = detectMobileDevice();
    
    // 如果移动端状态发生变化，重新应用布局
    if (wasMobile !== isMobileNow) {
        applyLayoutState();
        setupAreaHeights();
    }
    
    // 重新计算输出区高度
    if (SplitLayoutState.ui.autoAdjustOutputHeight) {
        calculateAndSetOutputHeight();
    }
}

// ===== 布局管理 =====
function applyLayoutState() {
    // 移动端强制使用堆叠布局
    if (SplitLayoutState.ui.isMobile && SplitLayoutState.layoutMode === 'split') {
        SplitLayoutState.layoutMode = 'stack';
    }
    
    // 应用布局模式
    if (SplitLayoutState.layoutMode === 'split') {
        DOM.splitContainer.classList.remove('stack-mode');
        setupSplitLayout();
    } else {
        DOM.splitContainer.classList.add('stack-mode');
        setupStackLayout();
    }
    
    // 更新布局切换按钮文本
    updateLayoutToggleButton();
    
    // 更新比例指示器
    updateRatioIndicators();
    
    // 显示或隐藏存储状态
    if (SplitLayoutState.ui.showStorageStatus) {
        DOM.storageStatus.classList.remove('hidden');
    } else {
        DOM.storageStatus.classList.add('hidden');
    }
    
    // 显示或隐藏高度限制指示器
    if (DOM.heightLimitIndicator) {
        DOM.heightLimitIndicator.style.display = 'block';
    }
}

function setupSplitLayout() {
    // 设置左右分屏布局
    const containerWidth = DOM.splitContainer.offsetWidth - 40; // 减去padding
    const splitterWidth = DOM.splitter.offsetWidth;
    const availableWidth = containerWidth - splitterWidth;
    
    const leftWidth = availableWidth * SplitLayoutState.splitRatio;
    const rightWidth = availableWidth - leftWidth;
    
    // 应用宽度
    DOM.inputPanel.style.width = `${leftWidth}px`;
    DOM.inputPanel.style.flex = 'none';
    
    DOM.outputPanel.style.width = `${rightWidth}px`;
    DOM.outputPanel.style.flex = 'none';
    
    // 显示分屏线和比例指示器
    DOM.splitter.style.display = 'flex';
}

function setupStackLayout() {
    // 设置上下堆叠布局
    DOM.inputPanel.style.width = '100%';
    DOM.inputPanel.style.flex = '1';
    
    DOM.outputPanel.style.width = '100%';
    DOM.outputPanel.style.flex = '1';
    DOM.outputPanel.style.marginTop = '10px';
    
    // 隐藏分屏线（在堆叠模式下，分屏线可能会变成水平分割线）
    DOM.splitter.style.display = 'none';
}

function toggleLayout() {
    if (SplitLayoutState.layoutMode === 'split') {
        SplitLayoutState.layoutMode = 'stack';
    } else {
        SplitLayoutState.layoutMode = 'split';
    }
    
    applyLayoutState();
    saveState();
}

function updateLayoutToggleButton() {
    if (SplitLayoutState.layoutMode === 'split') {
        DOM.layoutToggleBtn.innerHTML = '<span>⬌</span><span class="layout-toggle-text">切换布局</span>';
        DOM.layoutToggleBtn.title = '切换到上下堆叠布局';
    } else {
        DOM.layoutToggleBtn.innerHTML = '<span>⬍</span><span class="layout-toggle-text">切换布局</span>';
        DOM.layoutToggleBtn.title = '切换到左右分屏布局';
    }
}

// ===== 分屏拖动功能 =====
function setupSplitterDrag() {
    if (!DOM.splitter) return;
    
    let startX = 0;
    let startWidth = 0;
    let containerWidth = 0;
    
    DOM.splitter.addEventListener('mousedown', startDrag);
    
    function startDrag(e) {
        e.preventDefault();
        if (SplitLayoutState.layoutMode !== 'split') return;
        
        SplitLayoutState.isDragging = true;
        startX = e.clientX;
        startWidth = DOM.inputPanel.offsetWidth;
        containerWidth = DOM.splitContainer.offsetWidth - 40;
        
        // 添加拖动样式
        DOM.splitter.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        // 添加事件监听器
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }
    
    function doDrag(e) {
        if (!SplitLayoutState.isDragging) return;
        
        const dx = e.clientX - startX;
        const splitterWidth = DOM.splitter.offsetWidth;
        const availableWidth = containerWidth - splitterWidth;
        
        // 计算新宽度（限制最小和最大宽度）
        const minWidth = 100;
        const maxWidth = availableWidth - 100;
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx));
        
        // 更新比例
        SplitLayoutState.splitRatio = newWidth / availableWidth;
        
        // 应用新布局
        setupSplitLayout();
        
        // 更新比例指示器
        updateRatioIndicators();
    }
    
    function stopDrag() {
        if (!SplitLayoutState.isDragging) return;
        
        SplitLayoutState.isDragging = false;
        DOM.splitter.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // 移除事件监听器
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
        
        // 保存状态
        saveState();
    }
}

function updateRatioIndicators() {
    if (!DOM.ratioCircles) return;
    
    // 找到最接近当前比例预设
    let closestRatio = SplitLayoutState.presetRatios[0];
    let minDiff = Math.abs(SplitLayoutState.splitRatio - closestRatio.value);
    
    SplitLayoutState.presetRatios.forEach(ratio => {
        const diff = Math.abs(SplitLayoutState.splitRatio - ratio.value);
        if (diff < minDiff) {
            minDiff = diff;
            closestRatio = ratio;
        }
    });
    
    // 更新比例指示器样式
    DOM.ratioCircles.forEach(circle => {
        const ratioValue = parseFloat(circle.dataset.ratio);
        const ratioLabel = circle.querySelector('.ratio-text');
        
        if (ratioValue === closestRatio.value) {
            circle.style.backgroundColor = '#4dabf7';
            circle.style.borderColor = '#1864ab';
            if (ratioLabel) {
                ratioLabel.style.color = 'white';
                ratioLabel.style.fontWeight = 'bold';
            }
        } else {
            circle.style.backgroundColor = '#f8f9fa';
            circle.style.borderColor = '#868e96';
            if (ratioLabel) {
                ratioLabel.style.color = '#495057';
                ratioLabel.style.fontWeight = 'normal';
            }
        }
    });
}

function applyPresetRatio(ratioValue) {
    if (SplitLayoutState.layoutMode !== 'split') return;
    
    SplitLayoutState.splitRatio = ratioValue;
    setupSplitLayout();
    updateRatioIndicators();
    saveState();
}

// ===== 编辑器功能 =====
function initEditor() {
    // 设置输入监听
    if (DOM.jsonInput) {
        DOM.jsonInput.addEventListener('input', function(e) {
            SplitLayoutState.editor.input = e.target.value;
            saveState();
        });
        
        // 加载示例数据
        loadExampleData();
    }
    
    // 设置格式化按钮
    if (DOM.formatBtn) {
        DOM.formatBtn.addEventListener('click', formatJSON);
    }
    
    // 设置压缩按钮
    if (DOM.compressBtn) {
        DOM.compressBtn.addEventListener('click', compressJSON);
    }
    
    // 设置清空按钮
    if (DOM.clearBtn) {
        DOM.clearBtn.addEventListener('click', clearEditor);
    }
}

function formatJSON() {
    try {
        const input = DOM.jsonInput.value.trim();
        if (!input) {
            DOM.jsonOutput.textContent = '请输入JSON数据';
            return;
        }
        
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        
        DOM.jsonOutput.textContent = formatted;
        SplitLayoutState.editor.output = formatted;
        
        // 格式化后自动调整输出区高度
        if (SplitLayoutState.ui.autoAdjustOutputHeight) {
            calculateAndSetOutputHeight();
        }
        
        saveState();
        
    } catch (error) {
        DOM.jsonOutput.textContent = `JSON解析错误: ${error.message}`;
    }
}

function compressJSON() {
    try {
        const input = DOM.jsonInput.value.trim();
        if (!input) {
            DOM.jsonOutput.textContent = '请输入JSON数据';
            return;
        }
        
        const parsed = JSON.parse(input);
        const compressed = JSON.stringify(parsed);
        
        DOM.jsonOutput.textContent = compressed;
        SplitLayoutState.editor.output = compressed;
        
        // 压缩后自动调整输出区高度
        if (SplitLayoutState.ui.autoAdjustOutputHeight) {
            calculateAndSetOutputHeight();
        }
        
        saveState();
        
    } catch (error) {
        DOM.jsonOutput.textContent = `JSON解析错误: ${error.message}`;
    }
}

function clearEditor() {
    DOM.jsonInput.value = '';
    DOM.jsonOutput.textContent = '{}';
    SplitLayoutState.editor.input = '';
    SplitLayoutState.editor.output = '';
    
    saveState();
}

function loadExampleData() {
    const example = {
        "project": "JSON格式化工具",
        "version": "第七期",
        "feature": "左右分屏布局",
        "description": "按照产品原型SVG实现的左右分屏布局",
        "status": "开发中",
        "developer": "开发团队",
        "created": new Date().toISOString().split('T')[0]
    };
    
    DOM.jsonInput.value = JSON.stringify(example, null, 2);
    SplitLayoutState.editor.input = DOM.jsonInput.value;
}

// ===== UI 反馈 =====
function showStorageStatus() {
    if (!SplitLayoutState.ui.showStorageStatus) return;
    
    // 显示保存状态
    DOM.storageStatus.style.opacity = '1';
    
    // 3秒后淡出
    setTimeout(() => {
        DOM.storageStatus.style.transition = 'opacity 0.5s ease';
        DOM.storageStatus.style.opacity = '0.5';
    }, 3000);
}

// ===== 事件监听器 =====
function setupEventListeners() {
    // 分屏拖动
    setupSplitterDrag();
    
    // 布局切换
    if (DOM.layoutToggleBtn) {
        DOM.layoutToggleBtn.addEventListener('click', toggleLayout);
    }
    
    // 比例指示器点击
    if (DOM.ratioCircles) {
        DOM.ratioCircles.forEach(circle => {
            circle.addEventListener('click', function() {
                const ratioValue = parseFloat(this.dataset.ratio);
                applyPresetRatio(ratioValue);
            });
        });
    }
    
    // 窗口大小变化
    window.addEventListener('resize', function() {
        if (SplitLayoutState.layoutMode === 'split') {
            setupSplitLayout();
        }
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter 格式化
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            formatJSON();
        }
        
        // Ctrl+Shift+Enter 压缩
        if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
            e.preventDefault();
            compressJSON();
        }
        
        // Ctrl+L 切换布局
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            toggleLayout();
        }
    });
}

// ===== 启动应用 =====
// 等待DOM加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}