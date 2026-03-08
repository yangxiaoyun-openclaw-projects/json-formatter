// 页面加载时读取URL参数
window.addEventListener('load', function() {
    loadFromURL();
    loadIndentFromURL();
});

// Upload functionality
document.getElementById('url-upload-btn').addEventListener('click', function() {
    const urlContainer = document.getElementById('url-input-container');
    urlContainer.style.display = urlContainer.style.display === 'none' ? 'flex' : 'none';
    document.getElementById('file-input').style.display = 'none';
    clearUploadError();
});

document.getElementById('file-upload-btn').addEventListener('click', function() {
    document.getElementById('file-input').click();
    document.getElementById('url-input-container').style.display = 'none';
    clearUploadError();
});

document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        showUploadError('请选择JSON文件 (.json)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            // 验证是否为有效的JSON
            JSON.parse(content);
            document.getElementById('json-input').value = content;
            document.getElementById('format-btn').classList.add('active');
            document.getElementById('compress-btn').classList.remove('active');
            formatJSON();
            clearUploadError();
        } catch (err) {
            showUploadError('文件内容不是有效的JSON格式');
        }
    };
    reader.onerror = function() {
        showUploadError('读取文件失败');
    };
    reader.readAsText(file);
});

document.getElementById('url-load-btn').addEventListener('click', loadFromURLInput);

document.getElementById('url-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loadFromURLInput();
    }
});

document.getElementById('validation-toggle').addEventListener('change', function() {
    if (document.getElementById('json-input').value.trim()) {
        validateJSON();
    }
});

document.getElementById('fix-btn').addEventListener('click', function() {
    provideFixSuggestion();
});

document.getElementById('json-view-btn').addEventListener('click', function() {
    switchView('json');
});

document.getElementById('xml-view-btn').addEventListener('click', function() {
    convertToXML();
    switchView('xml');
});

// Add event listeners for converter options
document.querySelectorAll('.converter-option').forEach(btn => {
    btn.addEventListener('click', function() {
        const format = this.getAttribute('data-format');
        convertToFormat(format);
    });
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

function formatJSON() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');
    const copyBtn = document.getElementById('copy-btn');
    
    if (!input) {
        output.innerHTML = '';
        copyBtn.disabled = true;
        clearURL();
        currentJSON = null;
        clearValidation();
        return;
    }
    
    validateJSON();
    
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
        clearValidation();
        return;
    }
    
    validateJSON();
    
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

function validateJSON() {
    const input = document.getElementById('json-input').value.trim();
    const validationResult = document.getElementById('validation-result');
    const fixBtn = document.getElementById('fix-btn');
    
    if (!document.getElementById('validation-toggle').checked || !input) {
        validationResult.innerHTML = '';
        fixBtn.disabled = true;
        removeInputError();
        return;
    }
    
    try {
        JSON.parse(input);
        validationResult.innerHTML = '<div class="validation-success">✅ JSON语法正确</div>';
        fixBtn.disabled = true;
        removeInputError();
    } catch (e) {
        const errorInfo = parseJSONError(e, input);
        const lines = input.split('\n');
        let errorHtml = `<div class="validation-error"><strong>第${errorInfo.line}行：</strong> ${errorInfo.message}</div>`;
        
        // 显示上下文行
        const startLine = Math.max(0, errorInfo.line - 2);
        const endLine = Math.min(lines.length - 1, errorInfo.line);
        errorHtml += '<div style="margin-top: 8px; font-family: monospace; font-size: 12px; background: white; padding: 8px; border-radius: 4px;">';
        for (let i = startLine; i <= endLine; i++) {
            const lineNum = i + 1;
            const lineClass = lineNum === errorInfo.line ? 'input-error' : '';
            const linePrefix = lineNum === errorInfo.line ? `<span class="line-number">${lineNum}:</span>` : `${lineNum}:`;
            errorHtml += `<div class="${lineClass}" style="margin: 2px 0; padding: 2px 4px;">${linePrefix} ${escapeHtml(lines[i] || '')}</div>`;
        }
        errorHtml += '</div>';
        
        validationResult.innerHTML = errorHtml;
        fixBtn.disabled = false;
        highlightInputError(errorInfo.line);
    }
}

function parseJSONError(error, input) {
    const lines = input.split('\n');
    let line = 1;
    let message = error.message;
    
    // 尝试从错误消息中提取位置信息
    const match = error.message.match(/position\s+(\d+)/i) || error.message.match(/at position (\d+)/i);
    if (match) {
        const position = parseInt(match[1]);
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            if (charCount + lines[i].length + 1 > position) {
                line = i + 1;
                break;
            }
            charCount += lines[i].length + 1; // +1 for newline
        }
    }
    
    // 简化错误消息
    if (message.includes('Unexpected token')) {
        message = '语法错误：意外的标记';
    } else if (message.includes('Unexpected end')) {
        message = 'JSON不完整';
    } else if (message.includes('Unexpected number')) {
        message = '数字格式错误';
    } else if (message.includes('Unexpected string')) {
        message = '字符串格式错误';
    } else if (message.includes('expected property name')) {
        message = '缺少属性名或引号';
    }
    
    return { line, message };
}

function highlightInputError(lineNumber) {
    const textarea = document.getElementById('json-input');
    const lines = textarea.value.split('\n');
    const start = lines.slice(0, lineNumber - 1).join('\n').length + (lineNumber > 1 ? 1 : 0);
    const length = lines[lineNumber - 1].length;
    
    // 滚动到错误行
    textarea.focus();
    textarea.setSelectionRange(start, start + length);
}

function removeInputError() {
    const textarea = document.getElementById('json-input');
    textarea.classList.remove('input-error');
}

function provideFixSuggestion() {
    const input = document.getElementById('json-input').value.trim();
    let fixed = input;
    
    // 简单的修复尝试
    // 1. 缺少闭合引号
    fixed = fixed.replace(/([{:,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*[:}])/g, '$1"$2"$3');
    
    // 2. 修复单引号（仅当双引号修复失败时）
    try {
        JSON.parse(fixed);
    } catch (e) {
        fixed = input.replace(/'/g, '"');
    }
    
    // 3. 修复未转义的控制字符
    fixed = fixed.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
    
    // 4. 修复布尔值小写
    fixed = fixed.replace(/:\s*true(?=[,\]}])/gi, ': true').replace(/:\s*false(?=[,\]}])/gi, ': false');
    fixed = fixed.replace(/:\s*null(?=[,\]}])/gi, ': null');
    
    if (fixed !== input) {
        document.getElementById('json-input').value = fixed;
        validateJSON();
        showFixToast('已尝试修复一些常见错误');
    } else {
        showFixToast('无法自动修复，请手动检查错误');
    }
}

function showFixToast(message) {
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }, 10);
}

function clearValidation() {
    document.getElementById('validation-result').innerHTML = '';
    document.getElementById('fix-btn').disabled = true;
    removeInputError();
}

function switchView(viewType) {
    // Hide all views and remove active classes
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-content').forEach(view => view.style.display = 'none');
    
    if (viewType === 'json') {
        document.getElementById('json-view-btn').classList.add('active');
        document.getElementById('json-view').style.display = 'block';
    } else if (viewType === 'xml') {
        document.getElementById('xml-view-btn').classList.add('active');
        document.getElementById('xml-view').style.display = 'block';
    } else if (['csv', 'yaml', 'tsv'].includes(viewType)) {
        document.getElementById(`${viewType}-view`).style.display = 'block';
    }
}

function convertToXML() {
    const input = document.getElementById('json-input').value.trim();
    if (!input) {
        document.getElementById('xml-output').textContent = '';
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        const xml = jsonToXML(parsed);
        document.getElementById('xml-output').innerHTML = highlightXML(xml);
    } catch (e) {
        document.getElementById('xml-output').textContent = '无法转换：JSON格式错误';
    }
}

function jsonToXML(obj, indent = 0, rootName = 'root') {
    const spaces = '  '.repeat(indent);
    
    if (obj === null || obj === undefined) {
        return `${spaces}<${rootName} type="null"/>`;
    }
    
    if (typeof obj === 'boolean') {
        return `${spaces}<${rootName} type="boolean">${obj}</${rootName}>`;
    }
    
    if (typeof obj === 'number') {
        return `${spaces}<${rootName} type="number">${obj}</${rootName}>`;
    }
    
    if (typeof obj === 'string') {
        const escaped = escapeXML(obj);
        return `${spaces}<${rootName} type="string">${escaped}</${rootName}>`;
    }
    
    if (Array.isArray(obj)) {
        if (obj.length === 0) {
            return `${spaces}<${rootName} type="array" count="0"/>`;
        }
        
        let result = `${spaces}<${rootName} type="array" count="${obj.length}">\n`;
        obj.forEach((item, index) => {
            const itemName = `item${index}`;
            result += jsonToXML(item, indent + 1, itemName) + '\n';
        });
        result += `${spaces}</${rootName}>`;
        return result;
    }
    
    if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length === 0) {
            return `${spaces}<${rootName} type="object"/>`;
        }
        
        let result = `${spaces}<${rootName} type="object">\n`;
        keys.forEach(key => {
            const validName = key.replace(/[^a-zA-Z0-9_-]/g, '_');
            result += jsonToXML(obj[key], indent + 1, validName) + '\n';
        });
        result += `${spaces}</${rootName}>`;
        return result;
    }
    
    return `${spaces}<${rootName} type="unknown">${String(obj)}</${rootName}>`;
}

function escapeXML(text) {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
}

function highlightXML(xml) {
    return xml
        .replace(/&lt;([a-zA-Z0-9_-]+)(.*?)&gt;/g, (match, tagName, attrs) => {
            let highlighted = `<span class="xml-tag">&lt;${tagName}</span>`;
            if (attrs) {
                highlighted += attrs.replace(/([a-zA-Z0-9_-]+)=&quot;([^&]*)&quot;/g, 
                    '<span class="xml-attr-name"> $1</span>=<span class="xml-attr-value">&quot;$2&quot;</span>');
            }
            highlighted += '<span class="xml-tag">&gt;</span>';
            return highlighted;
        })
        .replace(/&lt;\/([a-zA-Z0-9_-]+)&gt;/g, '<span class="xml-tag">&lt;/$1&gt;</span>')
        .replace(/&lt;([a-zA-Z0-9_-]+)(.*?)\/&gt;/g, (match, tagName, attrs) => {
            let highlighted = `<span class="xml-tag">&lt;${tagName}</span>`;
            if (attrs) {
                highlighted += attrs.replace(/([a-zA-Z0-9_-]+)=&quot;([^&]*)&quot;/g, 
                    '<span class="xml-attr-name"> $1</span>=<span class="xml-attr-value">&quot;$2&quot;</span>');
            }
            highlighted += '<span class="xml-tag">/&gt;</span>';
            return highlighted;
        })
        .replace(/([^<>&]+)(?=&lt;|$)/g, '<span class="xml-text">$1</span>');
}

function convertToFormat(format) {
    const input = document.getElementById('json-input').value.trim();
    if (!input) {
        document.getElementById(`${format}-output`).textContent = '';
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        let result;
        
        switch(format) {
            case 'csv':
                result = jsonToCSV(parsed);
                break;
            case 'yaml':
                result = jsonToYAML(parsed);
                break;
            case 'tsv':
                result = jsonToTSV(parsed);
                break;
            default:
                result = `不支持格式：${format}`;
        }
        
        document.getElementById(`${format}-output`).textContent = result;
        switchView(format);
    } catch (e) {
        document.getElementById(`${format}-output`).textContent = `转换失败：${e.message}`;
        switchView(format);
    }
}

function jsonToCSV(obj) {
    if (!Array.isArray(obj)) {
        return "CSV转换需要数组格式的JSON";
    }
    
    if (obj.length === 0) {
        return "";
    }
    
    // 获取所有键（表头）
    const headers = [];
    obj.forEach(item => {
        if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach(key => {
                if (!headers.includes(key)) {
                    headers.push(key);
                }
            });
        }
    });
    
    // CSV头部
    let csv = headers.map(h => escapeCSVField(h)).join(',') + '\n';
    
    // 数据行
    obj.forEach(item => {
        if (typeof item === 'object' && item !== null) {
            const row = headers.map(header => {
                const value = item[header];
                if (value === null || value === undefined) {
                    return '';
                }
                // 如果是对象或数组，转为JSON字符串
                if (typeof value === 'object') {
                    return escapeCSVField(JSON.stringify(value));
                }
                return escapeCSVField(String(value));
            });
            csv += row.join(',') + '\n';
        }
    });
    
    return csv;
}

function jsonToYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    
    if (obj === null || obj === undefined) {
        return `${spaces}null`;
    }
    
    if (typeof obj === 'boolean') {
        return `${spaces}${obj}`;
    }
    
    if (typeof obj === 'number') {
        return `${spaces}${obj}`;
    }
    
    if (typeof obj === 'string') {
        // 如果字符串包含特殊字符，需要加引号
        if (obj.includes(':') || obj.includes('#') || obj.includes('"') || obj.includes("'") || 
            obj.includes('[') || obj.includes(']') || obj.includes('{') || obj.includes('}') ||
            obj.includes('\n') || obj.includes('\t') || obj.trim() !== obj) {
            return `${spaces}"${escapeYAMLString(obj)}"`;
        }
        return `${spaces}${obj}`;
    }
    
    if (Array.isArray(obj)) {
        if (obj.length === 0) {
            return `${spaces}[]`;
        }
        
        let yaml = '';
        obj.forEach((item, index) => {
            if (index === 0) {
                yaml += `${spaces}- ${jsonToYAML(item, 0).trimStart()}`;
            } else {
                yaml += `\n${spaces}- ${jsonToYAML(item, 0).trimStart()}`;
            }
        });
        return yaml;
    }
    
    if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        if (keys.length === 0) {
            return `${spaces}{}`;
        }
        
        let yaml = '';
        keys.forEach((key, index) => {
            const value = obj[key];
            const keyYAML = escapeYAMLString(key);
            const valueYAML = jsonToYAML(value, indent + 1);
            
            if (index === 0) {
                yaml += `${spaces}${keyYAML}: ${valueYAML.trimStart()}`;
            } else {
                yaml += `\n${spaces}${keyYAML}: ${valueYAML.trimStart()}`;
            }
        });
        return yaml;
    }
    
    return `${spaces}${String(obj)}`;
}

function jsonToTSV(obj) {
    if (!Array.isArray(obj)) {
        return "TSV转换需要数组格式的JSON";
    }
    
    if (obj.length === 0) {
        return "";
    }
    
    // 获取所有键（表头）
    const headers = [];
    obj.forEach(item => {
        if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach(key => {
                if (!headers.includes(key)) {
                    headers.push(key);
                }
            });
        }
    });
    
    // TSV头部
    let tsv = headers.join('\t') + '\n';
    
    // 数据行
    obj.forEach(item => {
        if (typeof item === 'object' && item !== null) {
            const row = headers.map(header => {
                const value = item[header];
                if (value === null || value === undefined) {
                    return '';
                }
                // TSV中需要用引号包裹包含制表符、换行符或引号的字段
                const str = String(value);
                if (str.includes('\t') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
            tsv += row.join('\t') + '\n';
        }
    });
    
    return tsv;
}

function escapeCSVField(field) {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function escapeYAMLString(str) {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
}

function loadFromURLInput() {
    const url = document.getElementById('url-input').value.trim();
    if (!url) {
        showUploadError('请输入URL');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showUploadError('请输入有效的URL（以 http:// 或 https:// 开头）');
        return;
    }
    
    clearUploadError();
    fetchJSONFromURL(url);
}

function fetchJSONFromURL(url) {
    document.getElementById('url-load-btn').disabled = true;
    document.getElementById('url-load-btn').textContent = '加载中...';
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const jsonString = JSON.stringify(data);
            document.getElementById('json-input').value = jsonString;
            document.getElementById('format-btn').classList.add('active');
            document.getElementById('compress-btn').classList.remove('active');
            formatJSON();
            document.getElementById('url-input-container').style.display = 'none';
            document.getElementById('url-input').value = '';
            clearUploadError();
        })
        .catch(error => {
            showUploadError(`加载失败: ${error.message}`);
        })
        .finally(() => {
            document.getElementById('url-load-btn').disabled = false;
            document.getElementById('url-load-btn').textContent = '加载';
        });
}

function showUploadError(message) {
    const errorEl = document.getElementById('upload-error');
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

function clearUploadError() {
    const errorEl = document.getElementById('upload-error');
    errorEl.textContent = '';
    errorEl.classList.remove('show');
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
