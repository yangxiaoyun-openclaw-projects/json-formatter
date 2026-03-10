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
    
    // Markdown导出功能
    document.getElementById('markdown-export-html-btn').addEventListener('click', exportMarkdownToHTML);
    document.getElementById('markdown-export-pdf-btn').addEventListener('click', exportMarkdownToPDF);
    
    // 分屏布局功能初始化
    initSplitLayout();
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
        // 先处理代码块（避免代码块内的Markdown被解析）
        let html = input;
        const codeBlocks = [];
        // 提取带语言标识的代码块
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, function(match, lang, code) {
            const id = '```CODEBLOCK-' + codeBlocks.length + '```';
            codeBlocks.push({ lang: lang || '', code: code });
            return id;
        });
        
        // 处理标题
        html = html
            .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 粗体
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/__(.*?)__/gim, '<strong>$1</strong>')
            // 斜体
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/_(.*?)_/gim, '<em>$1</em>')
            // 删除线
            .replace(/~~(.*?)~~/gim, '<del>$1</del>')
            // 引用块（支持多行）
            .replace(/^> (.*(\n>.*)*)/gim, function(match, content) {
                const lines = content.replace(/^> /gim, '');
                return `<blockquote>${lines}</blockquote>`;
            });
        
        // 处理表格
        html = html.replace(/^\|.*\|\n\|[-:\s|]*\|\n((?:\|.*\|\n?)*)/gim, function(match, rows) {
            const lines = match.trim().split('\n');
            if (lines.length < 2) return match;
            
            // 表头
            const headerCells = lines[0].split('|').map(cell => cell.trim()).filter(cell => cell);
            // 分隔行（处理对齐）
            const alignCells = lines[1].split('|').map(cell => cell.trim()).filter(cell => cell);
            // 内容行
            const rowLines = lines.slice(2);
            
            let tableHtml = '<table><thead><tr>';
            // 生成表头
            headerCells.forEach((cell, index) => {
                const align = getTableAlign(alignCells[index]);
                tableHtml += `<th${align ? ` align="${align}"` : ''}>${cell}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';
            
            // 生成内容行
            rowLines.forEach(line => {
                if (!line.trim()) return;
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                tableHtml += '<tr>';
                cells.forEach((cell, index) => {
                    const align = getTableAlign(alignCells[index]);
                    tableHtml += `<td${align ? ` align="${align}"` : ''}>${cell}</td>`;
                });
                tableHtml += '</tr>';
            });
            
            tableHtml += '</tbody></table>';
            return tableHtml;
        });
        
        // 处理无序列表
        html = html.replace(/^([-*+]) (.*(\n {2,}.*)*)/gim, function(match, marker, content) {
            const items = content.split(/\n(?=[-*+] )/);
            let ulHtml = '<ul>';
            items.forEach(item => {
                // 处理嵌套列表
                const nested = item.replace(/\n {2,}/g, ' ');
                // 检查任务列表
                const taskMatch = nested.match(/^\[([ x])\] (.*)/);
                if (taskMatch) {
                    const checked = taskMatch[1] === 'x' ? 'checked disabled' : 'disabled';
                    ulHtml += `<li class="task"><input type="checkbox" ${checked}> ${taskMatch[2]}</li>`;
                } else {
                    ulHtml += `<li>${nested}</li>`;
                }
            });
            ulHtml += '</ul>';
            return ulHtml;
        });
        
        // 处理有序列表
        html = html.replace(/^(\d+)\. (.*(\n {2,}.*)*)/gim, function(match, start, content) {
            const items = content.split(/\n(?=\d+\. )/);
            let olHtml = `<ol start="${start}">`;
            items.forEach(item => {
                // 处理嵌套列表
                const nested = item.replace(/\n {2,}/g, ' ');
                olHtml += `<li>${nested}</li>`;
            });
            olHtml += '</ol>';
            return olHtml;
        });
        
        // 行内元素
        html = html
            // 行内代码
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            // 图片
            .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2">')
            // 链接
            .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
            // 换行（保留段落）
            .replace(/\n\n/gim, '</p><p>')
            .replace(/\n/gim, '<br>');
        
        // 包裹段落
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }
        html = html.replace(/<\/p><p>$/, '');
        
        // 恢复代码块
        codeBlocks.forEach((block, index) => {
            const id = '```CODEBLOCK-' + index + '```';
            const codeLines = block.code.split('\n');
            const numberedCode = codeLines.map((line, i) => 
                `<span class="code-line" data-line="${i+1}">${escapeHtml(line)}</span>`
            ).join('\n');
            
            const langText = block.lang || 'code';
            const codeHtml = `
                <div class="code-block-container">
                    <div class="code-block-header">
                        <span class="code-lang">${escapeHtml(langText)}</span>
                        <button class="code-copy-btn" onclick="copyCodeBlock(this)">复制</button>
                    </div>
                    <pre class="code-pre"><code class="language-${block.lang}">${numberedCode}</code></pre>
                </div>
            `;
            html = html.replace(id, codeHtml);
        });
        
        // 清理多余的br
        html = html.replace(/<br>\s*<\/(h[1-6]|ul|ol|li|blockquote|table|pre)>/gim, '</$1>');
        html = html.replace(/<\/(h[1-6]|ul|ol|li|blockquote|table|pre)>\s*<br>/gim, '</$1>');
        
        output.innerHTML = html;
        document.getElementById('copy-btn').disabled = false;
        
        // 代码高亮
        highlightCode();
        
        // 数学公式渲染
        renderMath();
        
        // 更新URL
        updateURLWithContent(input);
    } catch (e) {
        output.innerHTML = `<span style="color: #d32f2f;">渲染错误: ${escapeHtml(e.message)}</span>`;
        document.getElementById('copy-btn').disabled = true;
    }
}

// 获取表格对齐方式
function getTableAlign(alignStr) {
    if (!alignStr) return '';
    if (alignStr.startsWith(':') && alignStr.endsWith(':')) return 'center';
    if (alignStr.endsWith(':')) return 'right';
    if (alignStr.startsWith(':')) return 'left';
    return '';
}

// 代码块复制功能
function copyCodeBlock(btn) {
    const container = btn.closest('.code-block-container');
    const code = container.querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '已复制';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
        btn.textContent = '复制失败';
        setTimeout(() => {
            btn.textContent = '复制';
        }, 2000);
    });
}

// 简单代码高亮实现
function highlightCode() {
    document.querySelectorAll('code[class*="language-"]').forEach(block => {
        const code = block.textContent;
        const lang = block.className.match(/language-(\w+)/)?.[1] || '';
        
        if (!lang) return;
        
        let highlighted = code;
        
        // 通用关键字高亮
        const keywords = {
            javascript: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'default', 'async', 'await', 'try', 'catch', 'new'],
            python: ['def', 'class', 'import', 'from', 'if', 'elif', 'else', 'for', 'while', 'return', 'try', 'except', 'finally', 'with', 'as', 'lambda', 'async', 'await'],
            java: ['public', 'private', 'protected', 'class', 'interface', 'static', 'final', 'void', 'int', 'String', 'boolean', 'if', 'else', 'for', 'while', 'return', 'try', 'catch', 'new'],
            go: ['func', 'package', 'import', 'var', 'const', 'type', 'struct', 'interface', 'if', 'else', 'for', 'range', 'return', 'go', 'chan', 'map', 'slice']
        };
        
        if (keywords[lang]) {
            keywords[lang].forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                highlighted = highlighted.replace(regex, `<span class="code-keyword">${keyword}</span>`);
            });
        }
        
        // 字符串高亮
        highlighted = highlighted.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="code-string">"$1"</span>');
        highlighted = highlighted.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '<span class="code-string">\'$1\'</span>');
        
        // 注释高亮
        highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="code-comment">$&</span>');
        highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, '<span class="code-comment">$&</span>');
        highlighted = highlighted.replace(/#.*$/gm, '<span class="code-comment">$&</span>');
        
        // 数字高亮
        highlighted = highlighted.replace(/\b\d+(\.\d+)?\b/g, '<span class="code-number">$&</span>');
        
        block.innerHTML = highlighted;
    });
}

// 数学公式渲染
function renderMath() {
    if (typeof renderMathInElement === 'undefined') {
        console.warn('KaTeX not loaded, skipping math rendering');
        return;
    }
    
    const output = document.getElementById('markdown-output');
    
    try {
        renderMathInElement(output, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\(", right: "\\)", display: false},
                {left: "\\[", right: "\\]", display: true}
            ],
            throwOnError: false,
            errorColor: '#d32f2f',
            strict: 'ignore',
            trust: true,
            macros: {
                "\\R": "\\mathbb{R}",
                "\\Z": "\\mathbb{Z}",
                "\\N": "\\mathbb{N}",
                "\\Q": "\\mathbb{Q}",
                "\\C": "\\mathbb{C}"
            }
        });
    } catch (e) {
        console.error('Math rendering error:', e);
    }
}

// 导出Markdown为HTML
function exportMarkdownToHTML() {
    const content = document.getElementById('markdown-output').innerHTML;
    const title = 'Markdown Export';
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.8;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #222;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 {
            margin: 24px 0 12px 0;
            font-weight: 600;
            line-height: 1.4;
            border-bottom: 1px solid #eee;
            padding-bottom: 4px;
        }
        h1 { font-size: 2em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.25em; }
        p { margin: 12px 0; }
        strong { font-weight: 600; }
        em { font-style: italic; }
        del { color: #666; }
        ul, ol { margin: 12px 0; padding-left: 24px; }
        li { margin: 4px 0; }
        blockquote {
            margin: 12px 0;
            padding: 8px 16px;
            border-left: 4px solid #4a90e2;
            background: #f5f8ff;
            color: #666;
        }
        pre {
            margin: 12px 0;
            padding: 16px;
            background: #f6f8fa;
            border-radius: 6px;
            overflow-x: auto;
            font-family: "SF Mono", Monaco, Menlo, monospace;
            font-size: 13px;
            line-height: 1.6;
        }
        code {
            padding: 2px 6px;
            background: #f6f8fa;
            border-radius: 4px;
            font-family: "SF Mono", Monaco, Menlo, monospace;
            font-size: 13px;
        }
        pre code {
            padding: 0;
            background: none;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 12px 0;
        }
        a {
            color: #4a90e2;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            border: 1px solid #eee;
        }
        th, td {
            padding: 8px 12px;
            border: 1px solid #eee;
            text-align: left;
        }
        th {
            background: #f6f8fa;
            font-weight: 600;
        }
        .katex-display {
            text-align: center;
            margin: 12px 0;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markdown-export.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('HTML导出成功');
}

// 导出Markdown为PDF
function exportMarkdownToPDF() {
    const content = document.getElementById('markdown-output').innerHTML;
    const title = 'Markdown Export';
    
    // 创建隐藏的iframe用于打印
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.8;
            color: #222;
            background: #fff;
        }
        h1, h2, h3, h4, h5, h6 {
            margin: 24px 0 12px 0;
            font-weight: 600;
            line-height: 1.4;
            border-bottom: 1px solid #eee;
            padding-bottom: 4px;
            page-break-after: avoid;
        }
        h1 { font-size: 2em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.25em; }
        p { margin: 12px 0; orphans: 3; widows: 3; }
        strong { font-weight: 600; }
        em { font-style: italic; }
        del { color: #666; }
        ul, ol { margin: 12px 0; padding-left: 24px; page-break-inside: avoid; }
        li { margin: 4px 0; }
        blockquote {
            margin: 12px 0;
            padding: 8px 16px;
            border-left: 4px solid #4a90e2;
            background: #f5f8ff;
            color: #666;
            page-break-inside: avoid;
        }
        pre {
            margin: 12px 0;
            padding: 16px;
            background: #f6f8fa;
            border-radius: 6px;
            overflow-x: auto;
            font-family: "SF Mono", Monaco, Menlo, monospace;
            font-size: 13px;
            line-height: 1.6;
            page-break-inside: avoid;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        code {
            padding: 2px 6px;
            background: #f6f8fa;
            border-radius: 4px;
            font-family: "SF Mono", Monaco, Menlo, monospace;
            font-size: 13px;
        }
        pre code {
            padding: 0;
            background: none;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
            margin: 12px 0;
            page-break-inside: avoid;
        }
        a {
            color: #4a90e2;
            text-decoration: none;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            border: 1px solid #eee;
            page-break-inside: avoid;
        }
        th, td {
            padding: 8px 12px;
            border: 1px solid #eee;
            text-align: left;
        }
        th {
            background: #f6f8fa;
            font-weight: 600;
        }
        .katex-display {
            text-align: center;
            margin: 12px 0;
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>
    `);
    doc.close();
    
    // 等待内容加载完成后打印
    iframe.contentWindow.onload = function() {
        setTimeout(() => {
            iframe.contentWindow.print();
            document.body.removeChild(iframe);
            showToast('PDF导出已启动，请在打印对话框中选择保存为PDF');
        }, 1000);
    };
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

// 分屏布局功能
function initSplitLayout() {
    const layoutToggleBtn = document.getElementById('layout-toggle-btn');
    const workArea = document.querySelector('.work-area');
    const splitLayout = document.getElementById('split-layout');
    const splitDivider = document.getElementById('split-divider');
    const inputPanel = document.getElementById('input-panel');
    const outputPanel = document.getElementById('output-panel');
    
    if (!layoutToggleBtn || !splitDivider) {
        console.log('分屏布局元素未找到，跳过初始化');
        return;
    }
    
    // 从localStorage加载布局偏好
    const savedLayout = localStorage.getItem('json-formatter-layout');
    const savedSplitRatio = localStorage.getItem('json-formatter-split-ratio');
    
    // 默认比例
    let splitRatio = savedSplitRatio ? parseFloat(savedSplitRatio) : 0.5;
    
    // 初始化布局
    if (savedLayout === 'split') {
        workArea.classList.add('split-mode');
        layoutToggleBtn.textContent = '⬍ 上下布局';
        updateSplitPanels(splitRatio);
    } else {
        workArea.classList.remove('split-mode');
        layoutToggleBtn.textContent = '⬌ 左右分屏';
        localStorage.setItem('json-formatter-layout', 'vertical');
    }
    
    // 布局切换按钮事件
    layoutToggleBtn.addEventListener('click', function() {
        if (workArea.classList.contains('split-mode')) {
            // 切换到上下布局
            workArea.classList.remove('split-mode');
            this.textContent = '⬌ 左右分屏';
            localStorage.setItem('json-formatter-layout', 'vertical');
        } else {
            // 切换到左右分屏
            workArea.classList.add('split-mode');
            this.textContent = '⬍ 上下布局';
            localStorage.setItem('json-formatter-layout', 'split');
            
            // 保存当前比例
            const rect = splitLayout.getBoundingClientRect();
            const currentRatio = inputPanel.offsetWidth / rect.width;
            localStorage.setItem('json-formatter-split-ratio', currentRatio);
        }
    });
    
    // 分屏拖拽功能
    let isDragging = false;
    let startX = 0;
    let startWidth = 0;
    let totalWidth = 0;
    
    splitDivider.addEventListener('mousedown', function(e) {
        if (!workArea.classList.contains('split-mode')) return;
        
        isDragging = true;
        startX = e.clientX;
        startWidth = inputPanel.offsetWidth;
        totalWidth = splitLayout.offsetWidth - splitDivider.offsetWidth;
        
        splitDivider.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const newInputWidth = Math.max(150, Math.min(totalWidth - 150, startWidth + dx));
        const newRatio = newInputWidth / totalWidth;
        
        updateSplitPanels(newRatio);
    });
    
    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        
        isDragging = false;
        splitDivider.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // 保存比例
        const rect = splitLayout.getBoundingClientRect();
        const totalWidth = rect.width - splitDivider.offsetWidth;
        const currentRatio = inputPanel.offsetWidth / totalWidth;
        localStorage.setItem('json-formatter-split-ratio', currentRatio);
    });
    
    // 触摸屏支持
    splitDivider.addEventListener('touchstart', function(e) {
        if (!workArea.classList.contains('split-mode')) return;
        
        isDragging = true;
        startX = e.touches[0].clientX;
        startWidth = inputPanel.offsetWidth;
        totalWidth = splitLayout.offsetWidth - splitDivider.offsetWidth;
        
        splitDivider.classList.add('dragging');
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging || !e.touches.length) return;
        
        const dx = e.touches[0].clientX - startX;
        const newInputWidth = Math.max(150, Math.min(totalWidth - 150, startWidth + dx));
        const newRatio = newInputWidth / totalWidth;
        
        updateSplitPanels(newRatio);
        e.preventDefault();
    });
    
    document.addEventListener('touchend', function() {
        if (!isDragging) return;
        
        isDragging = false;
        splitDivider.classList.remove('dragging');
        document.body.style.userSelect = '';
        
        // 保存比例
        const rect = splitLayout.getBoundingClientRect();
        const totalWidth = rect.width - splitDivider.offsetWidth;
        const currentRatio = inputPanel.offsetWidth / totalWidth;
        localStorage.setItem('json-formatter-split-ratio', currentRatio);
    });
    
    // 更新分屏面板比例
    function updateSplitPanels(ratio) {
        if (!workArea.classList.contains('split-mode')) return;
        
        const rect = splitLayout.getBoundingClientRect();
        const totalWidth = rect.width - splitDivider.offsetWidth;
        const inputWidth = Math.max(150, Math.min(totalWidth - 150, totalWidth * ratio));
        const outputWidth = totalWidth - inputWidth;
        
        inputPanel.style.flex = `0 0 ${inputWidth}px`;
        outputPanel.style.flex = `0 0 ${outputWidth}px`;
        
        // 更新比例指示器
        const inputPercent = Math.round((inputWidth / totalWidth) * 100);
        const outputPercent = Math.round((outputWidth / totalWidth) * 100);
        
        inputPanel.setAttribute('data-percent', inputPercent);
        outputPanel.setAttribute('data-percent', outputPercent);
    }
    
    // 窗口大小变化时调整
    window.addEventListener('resize', function() {
        if (workArea.classList.contains('split-mode')) {
            const savedRatio = localStorage.getItem('json-formatter-split-ratio');
            const ratio = savedRatio ? parseFloat(savedRatio) : 0.5;
            updateSplitPanels(ratio);
        }
    });
}