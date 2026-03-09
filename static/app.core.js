// 核心格式化功能 - 最小化版本
// 修复线上核心功能失效问题

let currentMode = 'json'; // 全局模式：json | markdown

document.addEventListener('DOMContentLoaded', function() {
    console.log('JSON Formatter Core加载完成');
    
    // 基础格式化功能
    document.getElementById('format-btn').addEventListener('click', formatJSON);
    document.getElementById('compress-btn').addEventListener('click', compressJSON);
    document.getElementById('copy-btn').addEventListener('click', copyResult);
    
    // 输入框实时格式化
    document.getElementById('json-input').addEventListener('input', function() {
        if (currentMode === 'json' && this.value.trim()) {
            document.getElementById('format-btn').classList.add('active');
            document.getElementById('compress-btn').classList.remove('active');
            formatJSON();
        } else if (currentMode === 'markdown' && this.value.trim()) {
            renderMarkdown();
        }
    });
    
    // 模式切换
    document.getElementById('json-mode-btn').addEventListener('click', () => switchMode('json'));
    document.getElementById('markdown-mode-btn').addEventListener('click', () => switchMode('markdown'));
});

// 模式切换功能
function switchMode(mode) {
    if (currentMode === mode) return;
    
    currentMode = mode;
    
    // 更新按钮状态
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${mode}-mode-btn`).classList.add('active');
    
    // 清空内容
    document.getElementById('json-input').value = '';
    document.getElementById('json-output').innerHTML = '';
    document.getElementById('markdown-output').innerHTML = '';
    document.getElementById('copy-btn').disabled = true;
    
    // 更新标题和占位符
    if (mode === 'json') {
        document.getElementById('app-title').textContent = 'JSON 格式化工具';
        document.getElementById('input-title').textContent = '输入 JSON';
        document.getElementById('json-input').placeholder = '在此粘贴 JSON...';
        document.getElementById('format-btn').style.display = 'inline-block';
        document.getElementById('compress-btn').style.display = 'inline-block';
        document.getElementById('output-view-switcher').style.display = 'flex';
        document.getElementById('markdown-toolbar').style.display = 'none';
        
        // 显示JSON视图
        document.querySelectorAll('.view-content').forEach(view => view.style.display = 'none');
        document.getElementById('json-view').style.display = 'block';
        document.getElementById('json-view-btn').classList.add('active');
    } else if (mode === 'markdown') {
        document.getElementById('app-title').textContent = 'Markdown 渲染工具';
        document.getElementById('input-title').textContent = '输入 Markdown';
        document.getElementById('json-input').placeholder = '在此粘贴 Markdown...';
        document.getElementById('format-btn').style.display = 'none';
        document.getElementById('compress-btn').style.display = 'none';
        document.getElementById('output-view-switcher').style.display = 'none';
        document.getElementById('markdown-toolbar').style.display = 'flex';
        
        // 显示Markdown视图
        document.querySelectorAll('.view-content').forEach(view => view.style.display = 'none');
        document.getElementById('markdown-view').style.display = 'block';
    }
}

function formatJSON() {
    const input = document.getElementById('json-input').value.trim();
    const indent = parseInt(document.getElementById('indent-select').value) || 2;
    
    if (!input) {
        document.getElementById('json-output').textContent = '';
        document.getElementById('copy-btn').disabled = true;
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, indent);
        document.getElementById('json-output').innerHTML = syntaxHighlight(formatted);
        document.getElementById('copy-btn').disabled = false;
        
        // 更新URL
        updateURLWithJSON(input);
    } catch (e) {
        document.getElementById('json-output').innerHTML = `<span style="color: #d32f2f;">JSON格式错误: ${escapeHtml(e.message)}</span>`;
        document.getElementById('copy-btn').disabled = true;
    }
}

function compressJSON() {
    const input = document.getElementById('json-input').value.trim();
    
    if (!input) {
        document.getElementById('json-output').textContent = '';
        document.getElementById('copy-btn').disabled = true;
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        const compressed = JSON.stringify(parsed);
        document.getElementById('json-output').innerHTML = syntaxHighlight(compressed);
        document.getElementById('copy-btn').disabled = false;
        document.getElementById('compress-btn').classList.add('active');
        document.getElementById('format-btn').classList.remove('active');
    } catch (e) {
        document.getElementById('json-output').innerHTML = `<span style="color: #d32f2f;">JSON格式错误: ${escapeHtml(e.message)}</span>`;
        document.getElementById('copy-btn').disabled = true;
    }
}

function syntaxHighlight(json) {
    if (!json) return '';
    
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function copyResult() {
    let output = '';
    if (currentMode === 'json') {
        output = document.getElementById('json-output').textContent;
    } else if (currentMode === 'markdown') {
        // Markdown模式复制渲染后的文本或原始Markdown
        output = document.getElementById('json-input').value; // 默认复制原始Markdown
    }
    
    if (!output) return;
    
    navigator.clipboard.writeText(output).then(() => {
        showToast('已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制');
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 1000;
        animation: fadein 0.5s, fadeout 0.5s 2.5s;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateURLWithJSON(json) {
    try {
        const encoded = btoa(encodeURIComponent(json));
        const url = new URL(window.location);
        url.searchParams.set('json', encoded);
        window.history.replaceState({}, '', url.toString());
    } catch (e) {
        console.error('更新URL失败:', e);
    }
}

// 从URL加载JSON
function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const encoded = urlParams.get('json');
    if (encoded) {
        try {
            const json = decodeURIComponent(atob(encoded));
            document.getElementById('json-input').value = json;
            formatJSON();
        } catch (e) {
            console.error('从URL加载JSON失败:', e);
        }
    }
}

// Markdown渲染功能
function renderMarkdown() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('markdown-output');
    
    if (!input) {
        output.innerHTML = '';
        document.getElementById('copy-btn').disabled = true;
        return;
    }
    
    try {
        // 简单的Markdown渲染实现
        let html = input
            // 标题
            .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 粗体
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            // 斜体
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            // 删除线
            .replace(/~~(.*?)~~/gim, '<del>$1</del>')
            // 无序列表
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            // 有序列表
            .replace(/^(\d+)\. (.*$)/gim, '<li value="$1">$2</li>')
            // 任务列表
            .replace(/^- \[x\] (.*$)/gim, '<li class="task completed"><input type="checkbox" checked disabled> $1</li>')
            .replace(/^- \[ \] (.*$)/gim, '<li class="task"><input type="checkbox" disabled> $1</li>')
            // 引用块
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            // 代码块
            .replace(/```([^`]+)```/gim, '<pre><code>$1</code></pre>')
            // 行内代码
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            // 图片
            .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2">')
            // 链接
            .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
            // 表格
            .replace(/^\|(.*)\|$/gim, function(match, p1) {
                return '<tr><td>' + p1.split('|').join('</td><td>') + '</td></tr>';
            })
            // 换行
            .replace(/\n/gim, '<br>');
        
        // 包裹列表
        html = html.replace(/(<li>.*?<\/li>)/gim, '<ul>$1</ul>');
        // 合并相邻ul
        html = html.replace(/<\/ul>\s*<ul>/gim, '');
        // 包裹表格
        html = html.replace(/(<tr>.*?<\/tr>)/gim, '<table>$1</table>');
        // 合并相邻table
        html = html.replace(/<\/table>\s*<table>/gim, '');
        
        output.innerHTML = html;
        document.getElementById('copy-btn').disabled = false;
        
        // 更新URL
        updateURLWithContent(input);
    } catch (e) {
        output.innerHTML = `<span style="color: #d32f2f;">渲染错误: ${escapeHtml(e.message)}</span>`;
        document.getElementById('copy-btn').disabled = true;
    }
}

// 更新URL内容
function updateURLWithContent(content) {
    try {
        const encoded = btoa(encodeURIComponent(content));
        const url = new URL(window.location);
        url.searchParams.set('content', encoded);
        url.searchParams.set('mode', currentMode);
        window.history.replaceState({}, '', url.toString());
    } catch (e) {
        console.error('更新URL失败:', e);
    }
}

// 从URL加载内容
function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'json';
    const encoded = urlParams.get('content') || urlParams.get('json');
    
    if (encoded) {
        try {
            const content = decodeURIComponent(atob(encoded));
            document.getElementById('json-input').value = content;
            
            if (mode === 'markdown') {
                switchMode('markdown');
                renderMarkdown();
            } else {
                switchMode('json');
                formatJSON();
            }
        } catch (e) {
            console.error('从URL加载内容失败:', e);
        }
    }
}

// 页面加载时执行
window.addEventListener('load', function() {
    loadFromURL();
    
    // 如果有初始内容，格式化
    const input = document.getElementById('json-input').value.trim();
    if (input) {
        if (currentMode === 'json') {
            formatJSON();
        } else {
            renderMarkdown();
        }
    }
});