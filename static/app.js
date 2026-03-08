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

// Add event listeners for code generation options
document.querySelectorAll('.codegen-option').forEach(btn => {
    btn.addEventListener('click', function() {
        const lang = this.getAttribute('data-lang');
        generateCode(lang);
    });
});

// Theme toggle functionality
document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('json-formatter-theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    document.getElementById('theme-toggle').textContent = '☀️';
} else {
    document.getElementById('theme-toggle').textContent = '🌙';
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-theme');
    const themeToggle = document.getElementById('theme-toggle');
    
    if (isDark) {
        themeToggle.textContent = '☀️';
        localStorage.setItem('json-formatter-theme', 'dark');
    } else {
        themeToggle.textContent = '🌙';
        localStorage.setItem('json-formatter-theme', 'light');
    }
}

// Schema functionality
document.getElementById('generate-schema-btn').addEventListener('click', generateSchema);
document.getElementById('validate-schema-btn').addEventListener('click', validateSchema);
document.getElementById('schema-editor').addEventListener('dblclick', function() {
    this.setAttribute('contenteditable', 'true');
    this.focus();
});

// Auto-enable validate button when schema is modified
document.getElementById('schema-editor').addEventListener('input', function() {
    document.getElementById('validate-schema-btn').disabled = false;
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

function generateSchema() {
    const input = document.getElementById('json-input').value.trim();
    if (!input) {
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        const schema = generateJSONSchema(parsed);
        const schemaText = JSON.stringify(schema, null, 2);
        document.getElementById('schema-editor').textContent = schemaText;
        document.getElementById('validate-schema-btn').disabled = false;
        document.getElementById('schema-editor').setAttribute('contenteditable', 'true');
        document.getElementById('schema-result').style.display = 'none';
    } catch (e) {
        showSchemaError('无法生成Schema：JSON格式错误');
    }
}

function generateJSONSchema(obj, path = '#') {
    const schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "description": `Schema generated from ${path}`,
        "type": getJSONType(obj)
    };
    
    if (Array.isArray(obj)) {
        if (obj.length > 0) {
            // 取第一个元素作为数组项类型参考
            schema.items = generateJSONSchema(obj[0], `${path}/items`);
        } else {
            schema.items = {};
        }
        schema.minItems = 0;
    } else if (typeof obj === 'object' && obj !== null) {
        schema.properties = {};
        schema.required = [];
        
        Object.keys(obj).forEach(key => {
            schema.properties[key] = generateJSONSchema(obj[key], `${path}/${key}`);
            // 如果值不是null/undefined，则视为必需字段
            if (obj[key] !== null && obj[key] !== undefined) {
                schema.required.push(key);
            }
        });
        
        schema.additionalProperties = false;
    } else if (typeof obj === 'number') {
        schema.type = "number";
        schema.examples = [obj];
    } else if (typeof obj === 'string') {
        schema.type = "string";
        schema.examples = [obj];
    } else if (typeof obj === 'boolean') {
        schema.type = "boolean";
        schema.examples = [obj];
    } else if (obj === null) {
        schema.type = "null";
    }
    
    return schema;
}

function getJSONType(value) {
    if (Array.isArray(value)) return "array";
    if (value === null) return "null";
    if (typeof value === 'object') return "object";
    return typeof value;
}

function validateSchema() {
    const input = document.getElementById('json-input').value.trim();
    const schemaText = document.getElementById('schema-editor').textContent;
    
    if (!input) {
        showSchemaError('请先输入JSON');
        return;
    }
    
    if (!schemaText) {
        showSchemaError('请先生成或编辑Schema');
        return;
    }
    
    try {
        const data = JSON.parse(input);
        const schema = JSON.parse(schemaText);
        const errors = validateAgainstSchema(data, schema);
        
        if (errors.length === 0) {
            showSchemaSuccess('✅ JSON符合Schema');
        } else {
            let errorHtml = '<div class="schema-invalid">❌ JSON不符合Schema：</div>';
            errors.forEach(error => {
                errorHtml += `<div class="schema-error">${error.path}: ${error.message}</div>`;
            });
            document.getElementById('schema-result').innerHTML = errorHtml;
            document.getElementById('schema-result').style.display = 'block';
        }
    } catch (e) {
        showSchemaError(`验证失败：${e.message}`);
    }
}

function validateAgainstSchema(data, schema, path = '#') {
    const errors = [];
    
    // 检查类型
    if (schema.type) {
        const actualType = getJSONType(data);
        if (schema.type !== actualType) {
            errors.push({
                path: path,
                message: `期望类型 ${schema.type}，实际类型 ${actualType}`
            });
        }
    }
    
    // 检查对象属性
    if (schema.type === 'object' && typeof data === 'object' && data !== null && !Array.isArray(data)) {
        // 检查必需字段
        if (schema.required) {
            schema.required.forEach(key => {
                if (!(key in data)) {
                    errors.push({
                        path: `${path}/${key}`,
                        message: `缺少必需字段：${key}`
                    });
                }
            });
        }
        
        // 检查属性约束
        if (schema.properties) {
            Object.keys(data).forEach(key => {
                if (schema.properties[key]) {
                    const nestedErrors = validateAgainstSchema(data[key], schema.properties[key], `${path}/${key}`);
                    errors.push(...nestedErrors);
                } else if (schema.additionalProperties === false) {
                    errors.push({
                        path: `${path}/${key}`,
                        message: `不允许的字段：${key}`
                    });
                }
            });
        }
    }
    
    // 检查数组项
    if (schema.type === 'array' && Array.isArray(data)) {
        if (schema.items) {
            data.forEach((item, index) => {
                const nestedErrors = validateAgainstSchema(item, schema.items, `${path}/${index}`);
                errors.push(...nestedErrors);
            });
        }
        
        if (schema.minItems !== undefined && data.length < schema.minItems) {
            errors.push({
                path: path,
                message: `数组至少需要 ${schema.minItems} 项，实际 ${data.length} 项`
            });
        }
        
        if (schema.maxItems !== undefined && data.length > schema.maxItems) {
            errors.push({
                path: path,
                message: `数组最多允许 ${schema.maxItems} 项，实际 ${data.length} 项`
            });
        }
    }
    
    // 检查字符串约束
    if (schema.type === 'string' && typeof data === 'string') {
        if (schema.minLength !== undefined && data.length < schema.minLength) {
            errors.push({
                path: path,
                message: `字符串长度至少 ${schema.minLength} 字符，实际 ${data.length} 字符`
            });
        }
        
        if (schema.maxLength !== undefined && data.length > schema.maxLength) {
            errors.push({
                path: path,
                message: `字符串长度最多 ${schema.maxLength} 字符，实际 ${data.length} 字符`
            });
        }
    }
    
    // 检查数字约束
    if (schema.type === 'number' && typeof data === 'number') {
        if (schema.minimum !== undefined && data < schema.minimum) {
            errors.push({
                path: path,
                message: `数值不能小于 ${schema.minimum}`
            });
        }
        
        if (schema.maximum !== undefined && data > schema.maximum) {
            errors.push({
                path: path,
                message: `数值不能大于 ${schema.maximum}`
            });
        }
    }
    
    return errors;
}

function showSchemaSuccess(message) {
    const resultEl = document.getElementById('schema-result');
    resultEl.innerHTML = `<div class="schema-valid">${message}</div>`;
    resultEl.style.display = 'block';
}

function showSchemaError(message) {
    const resultEl = document.getElementById('schema-result');
    resultEl.innerHTML = `<div class="schema-invalid">${message}</div>`;
    resultEl.style.display = 'block';
}

function generateCode(language) {
    const input = document.getElementById('json-input').value.trim();
    if (!input) {
        document.getElementById(`${language}-output`).textContent = '';
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        let code;
        
        switch(language) {
            case 'typescript':
                code = generateTypeScript(parsed);
                break;
            case 'python':
                code = generatePython(parsed);
                break;
            case 'java':
                code = generateJava(parsed);
                break;
            case 'go':
                code = generateGo(parsed);
                break;
            default:
                code = `不支持的语言：${language}`;
        }
        
        document.getElementById(`${language}-output`).innerHTML = highlightCode(code, language);
        switchView(language);
    } catch (e) {
        document.getElementById(`${language}-output`).textContent = `生成失败：${e.message}`;
        switchView(language);
    }
}

function generateTypeScript(obj, className = 'GeneratedInterface') {
    let ts = `interface ${className} {\n`;
    
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const type = getTypeScriptType(value, key);
            ts += `  ${key}${isRequired(value) ? '' : '?'}: ${type};\n`;
        });
    } else if (Array.isArray(obj) && obj.length > 0) {
        const itemType = getTypeScriptType(obj[0], 'item');
        ts += `  [index: number]: ${itemType};\n`;
    } else {
        const type = getTypeScriptType(obj, 'value');
        ts += `  value: ${type};\n`;
    }
    
    ts += '}\n';
    return ts;
}

function generatePython(obj, className = 'GeneratedClass') {
    let py = `from dataclasses import dataclass\nfrom typing import Optional, List, Dict, Any\n\n`;
    
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        py += `@dataclass\nclass ${className}:\n`;
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const type = getPythonType(value);
            const optional = isRequired(value) ? '' : 'Optional[';
            const optionalClose = isRequired(value) ? '' : ']';
            const defaultVal = isRequired(value) ? '' : ' = None';
            py += `    ${key}: ${optional}${type}${optionalClose}${defaultVal}\n`;
        });
    } else {
        py += `# Simple type annotation\n${className} = ${getPythonType(obj)}\n`;
    }
    
    return py;
}

function generateJava(obj, className = 'GeneratedClass') {
    let java = `public class ${className} {\n`;
    
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const type = getJavaType(value);
            const fieldName = toCamelCase(key);
            const getterName = 'get' + capitalizeFirst(fieldName);
            const setterName = 'set' + capitalizeFirst(fieldName);
            
            java += `    private ${type} ${fieldName};\n\n`;
            java += `    public ${type} ${getterName}() {\n`;
            java += `        return this.${fieldName};\n`;
            java += `    }\n\n`;
            java += `    public void ${setterName}(${type} ${fieldName}) {\n`;
            java += `        this.${fieldName} = ${fieldName};\n`;
            java += `    }\n\n`;
        });
        
        java += '    @Override\n';
        java += '    public String toString() {\n';
        java += '        return "{\\" + \n';
        const fields = Object.keys(obj).map(key => {
            const fieldName = toCamelCase(key);
            return `                "\\"${key}\\": \\"" + ${fieldName} + "\\"`;
        }).join(' + ",\\" + \n');
        java += fields + ';\n';
        java += '    }\n';
    } else {
        const type = getJavaType(obj);
        java += `    private ${type} value;\n\n`;
        java += `    public ${type} getValue() {\n`;
        java += `        return this.value;\n`;
        java += `    }\n\n`;
        java += `    public void setValue(${type} value) {\n`;
        java += `        this.value = value;\n`;
        java += `    }\n`;
    }
    
    java += '}\n';
    return java;
}

function generateGo(obj, structName = 'GeneratedStruct') {
    let go = `type ${structName} struct {\n`;
    
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const type = getGoType(value);
            const fieldName = capitalizeFirst(toCamelCase(key));
            go += `    ${fieldName} ${type} \`json:"${key}"\`\n`;
        });
    } else {
        const type = getGoType(obj);
        go += `    Value ${type} \`json:"value"\`\n`;
    }
    
    go += '}\n';
    return go;
}

function getTypeScriptType(value, key) {
    if (Array.isArray(value)) {
        if (value.length > 0) {
            const itemType = getTypeScriptType(value[0], 'item');
            return `${itemType}[]`;
        }
        return 'any[]';
    }
    
    if (value === null) return 'null';
    if (typeof value === 'object' && value !== null) {
        // 如果是嵌套对象，递归生成
        const props = Object.keys(value).map(k => {
            const v = value[k];
            return `${k}${isRequired(v) ? '' : '?'}: ${getTypeScriptType(v, k)}`;
        }).join('; ');
        return `{ ${props} }`;
    }
    
    switch(typeof value) {
        case 'string': return 'string';
        case 'number': return 'number';
        case 'boolean': return 'boolean';
        default: return 'any';
    }
}

function getPythonType(value) {
    if (Array.isArray(value)) {
        if (value.length > 0) {
            const itemType = getPythonType(value[0]);
            return `List[${itemType}]`;
        }
        return 'List[Any]';
    }
    
    if (value === null) return 'Any';
    if (typeof value === 'object' && value !== null) return 'Dict[str, Any]';
    
    switch(typeof value) {
        case 'string': return 'str';
        case 'number': 
            return 'int' if (Number.isInteger(value)) else 'float';
        case 'boolean': return 'bool';
        default: return 'Any';
    }
}

function getJavaType(value) {
    if (Array.isArray(value)) {
        if (value.length > 0) {
            const itemType = getJavaType(value[0]);
            return `List<${itemType}>`;
        }
        return 'List<Object>';
    }
    
    if (value === null) return 'Object';
    if (typeof value === 'object' && value !== null) return 'Map<String, Object>';
    
    switch(typeof value) {
        case 'string': return 'String';
        case 'number': 
            return Number.isInteger(value) ? 'Integer' : 'Double';
        case 'boolean': return 'Boolean';
        default: return 'Object';
    }
}

function getGoType(value) {
    if (Array.isArray(value)) {
        if (value.length > 0) {
            const itemType = getGoType(value[0]);
            return `[]${itemType}`;
        }
        return '[]interface{}';
    }
    
    if (value === null) return 'interface{}';
    if (typeof value === 'object' && value !== null) return 'map[string]interface{}';
    
    switch(typeof value) {
        case 'string': return 'string';
        case 'number': 
            return Number.isInteger(value) ? 'int' : 'float64';
        case 'boolean': return 'bool';
        default: return 'interface{}';
    }
}

function isRequired(value) {
    return value !== null && value !== undefined;
}

function getPythonType(value) {
    if (Array.isArray(value)) {
        if (value.length > 0) {
            const itemType = getPythonType(value[0]);
            return `List[${itemType}]`;
        }
        return 'List[Any]';
    }
    
    if (value === null) return 'Any';
    if (typeof value === 'object' && value !== null) return 'Dict[str, Any]';
    
    switch(typeof value) {
        case 'string': return 'str';
        case 'number': 
            return Number.isInteger(value) ? 'int' : 'float';
        case 'boolean': return 'bool';
        default: return 'Any';
    }
}

function toCamelCase(str) {
    return str.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
    );
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function highlightCode(code, language) {
    // 简单的代码高亮
    let highlighted = code;
    
    // TypeScript
    if (language === 'typescript') {
        highlighted = highlighted
            .replace(/\b(interface|type|any|string|number|boolean|null|undefined|readonly)\b/g, '<span class="code-keyword">$1</span>')
            .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="code-type">$1</span>')
            .replace(/(".*?"|'.*?')/g, '<span class="code-string">$1</span>');
    }
    
    // Python
    if (language === 'python') {
        highlighted = highlighted
            .replace(/\b(def|class|import|from|Optional|List|Dict|Any|str|int|float|bool)\b/g, '<span class="code-keyword">$1</span>')
            .replace(/\b(dataclass)\b/g, '<span class="code-function">$1</span>')
            .replace(/#.*$/gm, '<span class="code-comment">$&</span>');
    }
    
    // Java
    if (language === 'java') {
        highlighted = highlighted
            .replace(/\b(public|private|class|void|String|Integer|Double|Boolean|Object|List|Map|Override)\b/g, '<span class="code-keyword">$1</span>')
            .replace(/@\w+/g, '<span class="code-function">$&</span>');
    }
    
    // Go
    if (language === 'go') {
        highlighted = highlighted
            .replace(/\b(type|struct|func|string|int|float64|bool|interface)\b/g, '<span class="code-keyword">$1</span>')
            .replace(/`json:".*?"`/g, '<span class="code-string">$&</span>');
    }
    
    return highlighted;
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

// Theme toggle function
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    if (body.classList.contains('dark-theme')) {
        // Switch to light theme
        body.classList.remove('dark-theme');
        themeToggle.textContent = '🌙';
        localStorage.setItem('json-formatter-theme', 'light');
    } else {
        // Switch to dark theme
        body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
        localStorage.setItem('json-formatter-theme', 'dark');
    }
}
