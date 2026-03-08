// 简单的语法检查
try {
    eval(`(function() {
        ${require('fs').readFileSync('static/app.js', 'utf8')}
    })`);
    console.log('✅ JavaScript语法正常');
} catch (e) {
    console.error('❌ JavaScript语法错误:', e.message);
    console.error('位置:', e.lineNumber, '行');
}