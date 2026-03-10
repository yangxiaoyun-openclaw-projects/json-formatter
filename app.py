from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import json
import base64
from io import BytesIO
import zipfile

app = Flask(__name__)
CORS(app)  # Enable CORS for API endpoints

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/split')
def split_layout():
    """第七期任务496：左右分屏布局"""
    return render_template('split_layout.html')

@app.route('/api/docs')
def api_docs():
    return render_template('api_docs.html')

@app.route('/api/format', methods=['POST'])
def api_format():
    """Format JSON with indentation"""
    try:
        data = request.get_json()
        if not data or 'json' not in data:
            return jsonify({'error': 'Missing JSON data'}), 400
        
        indent = data.get('indent', 2)
        parsed = json.loads(data['json'])
        formatted = json.dumps(parsed, indent=indent, ensure_ascii=False)
        
        return jsonify({
            'formatted': formatted,
            'size': len(formatted),
            'valid': True
        })
    except json.JSONDecodeError as e:
        return jsonify({'error': f'Invalid JSON: {str(e)}', 'valid': False}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/compress', methods=['POST'])
def api_compress():
    """Compress/minify JSON"""
    try:
        data = request.get_json()
        if not data or 'json' not in data:
            return jsonify({'error': 'Missing JSON data'}), 400
        
        parsed = json.loads(data['json'])
        compressed = json.dumps(parsed, separators=(',', ':'), ensure_ascii=False)
        
        return jsonify({
            'compressed': compressed,
            'size': len(compressed),
            'reduction': len(data['json']) - len(compressed),
            'valid': True
        })
    except json.JSONDecodeError as e:
        return jsonify({'error': f'Invalid JSON: {str(e)}', 'valid': False}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/validate', methods=['POST'])
def api_validate():
    """Validate JSON and provide suggestions"""
    try:
        data = request.get_json()
        if not data or 'json' not in data:
            return jsonify({'error': 'Missing JSON data'}), 400
        
        # Try to parse
        parsed = json.loads(data['json'])
        
        # Simple validation checks
        issues = []
        if len(data['json']) > 100000:
            issues.append('Large file detected (>100KB)')
        
        return jsonify({
            'valid': True,
            'issues': issues,
            'size': len(data['json']),
            'structure': 'object' if isinstance(parsed, dict) else 'array' if isinstance(parsed, list) else 'value'
        })
    except json.JSONDecodeError as e:
        # Try to provide suggestions
        error_msg = str(e)
        suggestions = []
        
        if 'Expecting property name enclosed in double quotes' in error_msg:
            suggestions.append('Ensure all property names are in double quotes')
        if 'Expecting \',\' delimiter' in error_msg:
            suggestions.append('Check for missing commas between items')
        if 'Expecting \':\' delimiter' in error_msg:
            suggestions.append('Check for missing colons between keys and values')
        
        return jsonify({
            'valid': False,
            'error': error_msg,
            'suggestions': suggestions
        }), 400

@app.route('/api/convert', methods=['POST'])
def api_convert():
    """Convert JSON to other formats"""
    try:
        data = request.get_json()
        if not data or 'json' not in data:
            return jsonify({'error': 'Missing JSON data'}), 400
        
        format_type = data.get('format', 'csv')
        parsed = json.loads(data['json'])
        
        result = ''
        if format_type == 'csv':
            result = json_to_csv(parsed)
        elif format_type == 'yaml':
            result = json_to_yaml(parsed)
        elif format_type == 'xml':
            result = json_to_xml(parsed)
        else:
            return jsonify({'error': f'Unsupported format: {format_type}'}), 400
        
        return jsonify({
            'result': result,
            'format': format_type,
            'size': len(result)
        })
    except json.JSONDecodeError as e:
        return jsonify({'error': f'Invalid JSON: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/batch', methods=['POST'])
def api_batch():
    """Batch process multiple JSON files"""
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        format_type = request.form.get('format', 'formatted')
        operation = request.form.get('operation', 'format')
        
        if not files:
            return jsonify({'error': 'No files provided'}), 400
        
        results = []
        errors = []
        
        for file in files:
            try:
                content = file.read().decode('utf-8')
                parsed = json.loads(content)
                
                if operation == 'format':
                    result = json.dumps(parsed, indent=2, ensure_ascii=False)
                elif operation == 'compress':
                    result = json.dumps(parsed, separators=(',', ':'), ensure_ascii=False)
                else:
                    result = content
                
                results.append({
                    'filename': file.filename,
                    'size': len(content),
                    'result_size': len(result),
                    'success': True
                })
            except Exception as e:
                errors.append({
                    'filename': file.filename,
                    'error': str(e)
                })
        
        return jsonify({
            'processed': len(results),
            'errors': len(errors),
            'results': results,
            'errors_list': errors
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download_batch', methods=['POST'])
def api_download_batch():
    """Download batch processed files as ZIP"""
    try:
        data = request.get_json()
        if not data or 'files' not in data:
            return jsonify({'error': 'No files provided'}), 400
        
        # Create in-memory ZIP file
        memory_file = BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            for file_data in data['files']:
                filename = file_data.get('filename', 'output.json')
                content = file_data.get('content', '')
                zf.writestr(filename, content)
        
        memory_file.seek(0)
        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name='json_batch_results.zip'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Utility functions
def json_to_csv(data):
    """Convert JSON array to CSV"""
    if not isinstance(data, list):
        return "CSV conversion requires array format"
    
    if not data:
        return ""
    
    # Get all unique keys
    headers = set()
    for item in data:
        if isinstance(item, dict):
            headers.update(item.keys())
    
    headers = list(headers)
    
    # Build CSV
    csv_lines = []
    csv_lines.append(','.join(f'"{h}"' for h in headers))
    
    for item in data:
        if isinstance(item, dict):
            row = []
            for header in headers:
                value = item.get(header, '')
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                # Escape quotes for CSV
                escaped_value = str(value).replace('"', '""')
                row.append(f'"{escaped_value}"')
            csv_lines.append(','.join(row))
    
    return '\n'.join(csv_lines)

def json_to_yaml(data, indent=0):
    """Convert JSON to YAML"""
    if isinstance(data, dict):
        lines = []
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                lines.append(f"{'  ' * indent}{key}:")
                lines.append(json_to_yaml(value, indent + 1))
            else:
                lines.append(f"{'  ' * indent}{key}: {value}")
        return '\n'.join(lines)
    elif isinstance(data, list):
        lines = []
        for item in data:
            lines.append(f"{'  ' * indent}- {json_to_yaml(item, indent) if isinstance(item, (dict, list)) else item}")
        return '\n'.join(lines)
    else:
        return str(data)

def json_to_xml(data, root_name='root'):
    """Convert JSON to XML"""
    def dict_to_xml(tag, d):
        xml_parts = []
        for key, value in d.items():
            if isinstance(value, dict):
                xml_parts.append(dict_to_xml(key, value))
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        xml_parts.append(dict_to_xml(key, item))
                    else:
                        xml_parts.append(f'<{key}>{item}</{key}>')
            else:
                xml_parts.append(f'<{key}>{value}</{key}>')
        return f'<{tag}>{"".join(xml_parts)}</{tag}>'
    
    if isinstance(data, dict):
        return dict_to_xml(root_name, data)
    elif isinstance(data, list):
        items = ''.join([dict_to_xml('item', item) if isinstance(item, dict) else f'<item>{item}</item>' for item in data])
        return f'<{root_name}>{items}</{root_name}>'
    else:
        return f'<{root_name}>{data}</{root_name}>'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
