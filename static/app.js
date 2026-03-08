document.getElementById('format-btn').addEventListener('click', function() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');
    
    if (!input) {
        output.innerHTML = '';
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        output.innerHTML = renderJSON(parsed, 0);
        output.classList.remove('error');
        bindToggleEvents();
    } catch (e) {
        output.textContent = 'JSON 格式错误';
        output.classList.add('error');
    }
});

function renderJSON(data, indent) {
    const spaces = '  '.repeat(indent);
    const nextSpaces = '  '.repeat(indent + 1);
    
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
