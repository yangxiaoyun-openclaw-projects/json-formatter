// 测试和修复正则表达式
const testRegex = /([{:,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*[:}])/g;

console.log('测试正则表达式...');
const testStr = '{name: value, key2: value2}';
const result = testStr.replace(testRegex, '$1"$2"$3');
console.log('原始:', testStr);
console.log('结果:', result);

// 尝试修复
console.log('\n检查字符类...');
const regexStr = '/([{:,]\\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\\s*[:}])/g';
console.log('正则字符串:', regexStr);

// 手动修复
const fixedRegex = /([{:,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*[:}])/g;
console.log('\n固定后的正则:', fixedRegex);