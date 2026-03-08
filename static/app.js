document.getElementById('format-btn').addEventListener('click', function() {
    const input = document.getElementById('json-input').value.trim();
    const output = document.getElementById('json-output');
    
    if (!input) {
        output.textContent = '';
        return;
    }
    
    try {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 2);
        output.textContent = formatted;
        output.classList.remove('error');
    } catch (e) {
        output.textContent = 'JSON 格式错误';
        output.classList.add('error');
    }
});
