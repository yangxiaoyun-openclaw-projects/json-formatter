// 页面加载时读取URL参数
window.addEventListener('load', function() {
    loadFromURL();
    loadIndentFromURL();
});

document.getElementById('format-btn').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('compress-btn').classList.remove('active');
    formatJSON();
});

document.getElementById('compress-btn').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('format-btn').classList.remove('active');
    compressJSON();
});

document.getElementById('indent-select').addEventListener('change', function() {
    currentIndent = parseInt(this.value);
    updateIndentURL();
    // 如果当前是格式化视图，重新格式化
    if (currentView === 'formatted' && currentJSON) {
        const output = document.getElementById('json-output');
        output.innerHTML = renderJSON(currentJSON, 0);
        bindToggleEvents();
    }
});

let currentView = 'formatted'; // 'formatted' or 'compressed'
let currentJSON = null;
let currentIndent = 2;

function formatJSON() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');
    const copyBtn = document.getElementById('copy-btn');
    
    if (!input) {
        output.innerHTML = '';
        copyBtn.disabled = true;
        clearURL();
        currentJSON = null;
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        currentJSON = parsed;
        currentView = 'formatted';
        output.innerHTML = renderJSON(parsed, 0);
        output.classList.remove('error');
        copyBtn.disabled = false;
        bindToggleEvents();
        updateURL(input);
    } catch (e) {
        output.textContent = 'JSON 格式错误';
        output.classList.add('error');
        copyBtn.disabled = true;
        clearURL();
        currentJSON = null;
    }
}

function compressJSON() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');
    const copyBtn = document.getElementById('copy-btn');
    
    if (!input) {
        output.innerHTML = '';
        copyBtn.disabled = true;
        clearURL();
        currentJSON = null;
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        currentJSON = parsed;
        currentView = 'compressed';
        const compressed = JSON.stringify(parsed);
        output.textContent = compressed;
        output.classList.remove('error');
        copyBtn.disabled = false;
        updateURL(input);
    } catch (e) {
        output.textContent = 'JSON 格式错误';
        output.classList.add('error');
        copyBtn.disabled = true;
        clearURL();
        currentJSON = null;
    }
}

function updateURL(json) {
    const params = new URLSearchParams();
    params.set('json', btoa(encodeURIComponent(json)));
    params.set('indent', currentIndent);
    const newUrl = window.location.origin + window.location.pathname + '?' + params.toString();
    window.history.pushState({json: json}, '', newUrl);
}

function updateIndentURL() {
    if (!currentJSON) return;
    const json = document.getElementById('json-input').value.trim();
    if (!json) return;
    
    const params = new URLSearchParams();
    params.set('json', btoa(encodeURIComponent(json)));
    params.set('indent', currentIndent);
    const newUrl = window.location.origin + window.location.pathname + '?' + params.toString();
    window.history.pushState({json: json}, '', newUrl);
}

function clearURL() {
    const newUrl = window.location.origin + window.location.pathname;
    window.history.pushState({}, '', newUrl);
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('json');
    
    if (encoded) {
        try {
            const json = decodeURIComponent(atob(encoded));
            document.getElementById('json-input').value = json;
            // 默认使用格式化视图
            document.getElementById('format-btn').classList.add('active');
            document.getElementById('compress-btn').classList.remove('active');
            formatJSON();
        } catch (e) {
            console.error('Failed to decode URL parameter:', e);
        }
    }
}

function loadIndentFromURL() {
    const params = new URLSearchParams(window.location.search);
    const indent = params.get('indent');
    if (indent && ['2', '3', '4'].includes(indent)) {
        currentIndent = parseInt(indent);
        document.getElementById('indent-select').value = indent;
    }
}

// 支持浏览器后退/前进保持状态
window.addEventListener('popstate', function(event) {
    loadFromURL();
});

// Copy functionality
document.getElementById('copy-btn').addEventListener('click', function() {
    const output = document.getElementById('json-output');
    const text = output.textContent;
    
    if (!text || text === 'JSON 格式错误') {
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showCopyToast();
    }).catch(err => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyToast();
    });
});

function showCopyToast() {
    const toast = document.getElementById('copy-toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function renderJSON(data, indent) {
    const spaces = ' '.repeat(currentIndent).repeat(indent);
    const nextSpaces = ' '.repeat(currentIndent).repeat(indent + 1);
    
    if (data === null) {
        return '<span class="json-null">null</span>';
    }
    
    if (typeof data === 'boolean') {
        return '<span class="json-boolean">' + data + '</span>';
    }
    
    if (typeof data === 'number') {
        return '<span class="json-number">' + data + '</span>';
    }
    
    if (typeof data === 'string') {
        return '<span class="json-string">"' + escapeHtml(data) + '"</span>';
    }
    
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return '<span class="json-bracket">[]</span>';
        }
        
        const id = 'collapse-' + Math.random().toString(36).substr(2, 9);
        let items = data.map((item, index) => {
            return nextSpaces + renderJSON(item, indent + 1);
        }).join(',\n');
        
        return `<span class="json-collapsible" data-target="${id}">[<span class="json-ellipsis" id="${id}">...</span><span class="json-content">` +
               `\n${items}\n${spaces}</span>]</span>`;
    }
    
    if (typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length === 0) {
            return '<span class="json-bracket">{}</span>';
        }
        
        const id = 'collapse-' + Math.random().toString(36).substr(2, 9);
        let items = keys.map(key => {
            return nextSpaces + '<span class="json-key">"' + escapeHtml(key) + '"</span>: ' + 
                   renderJSON(data[key], indent + 1);
        }).join(',\n');
        
        return `<span class="json-collapsible" data-target="${id}">{<span class="json-ellipsis" id="${id}">...</span><span class="json-content">` +
               `\n${items}\n${spaces}</span>}</span>`;
    }
    
    return String(data);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function bindToggleEvents() {
    document.querySelectorAll('.json-collapsible').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const targetId = this.getAttribute('data-target');
            const ellipsis = document.getElementById(targetId);
            const content = this.querySelector('.json-content');
            
            if (ellipsis.style.display === 'none') {
                ellipsis.style.display = 'inline';
                content.style.display = 'none';
            } else {
                ellipsis.style.display = 'none';
                content.style.display = 'inline';
            }
        });
    });
    
    // 默认展开最外层
    document.querySelectorAll('.json-ellipsis').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.json-content').forEach(el => {
        el.style.display = 'inline';
    });
}
