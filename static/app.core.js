// 核心格式化功能 - 最小化版本
// 修复线上核心功能失效问题

document.addEventListener('DOMContentLoaded', function() {
    console.log('JSON Formatter Core加载完成');
    
    // 基础格式化功能
    document.getElementById('format-btn').addEventListener('click', formatJSON);
    document.getElementById('compress-btn').addEventListener('click', compressJSON);
    document.getElementById('copy-btn').addEventListener('click', copyResult);
    
    // 输入框实时格式化
    document.getElementById('json-input').addEventListener('input', function() {
        if (this.value.trim()) {
            document.getElementById('format-btn').classList.add('active');
            document.getElementById('compress-btn').classList.remove('active');
            formatJSON();
        }
    });
});

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
    const output = document.getElementById('json-output').textContent;
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

// 页面加载时执行
window.addEventListener('load', function() {
    loadFromURL();
    
    // 如果有初始内容，格式化
    const input = document.getElementById('json-input').value.trim();
    if (input) {
        formatJSON();
    }
});