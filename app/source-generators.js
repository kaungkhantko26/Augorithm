(function exposeSourceGenerators(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AugorithmSourceGenerators = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const JAVA_RESERVED = new Set([
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
    'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
    'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
    'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
    'package', 'private', 'protected', 'public', 'return', 'short', 'static',
    'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
    'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null',
    'record', 'sealed', 'permits', 'var', 'yield'
  ]);

  function sanitizeJavaIdentifier(value, fallback = 'value') {
    let identifier = String(value || '').trim()
      .replace(/[^\p{L}\p{N}_$]+/gu, '_')
      .replace(/^(\d)/, '_$1');
    if (!identifier) identifier = fallback;
    if (JAVA_RESERVED.has(identifier.toLowerCase())) identifier += 'Value';
    return identifier;
  }

  function sanitizeJavaClassName(value) {
    const words = String(value || 'AugorithmProgram')
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    let name = words.map(word => word[0].toUpperCase() + word.slice(1)).join('');
    name = sanitizeJavaIdentifier(name, 'AugorithmProgram');
    if (!/^[A-Z]/.test(name)) name = `Algorithm${name}`;
    return name;
  }

  function normalizeJavaType(type) {
    const normalized = String(type || '').trim().toLowerCase();
    if (/^(?:integer|int|whole|long)$/.test(normalized)) return 'int';
    if (/^(?:real|float|double|decimal|number)$/.test(normalized)) return 'double';
    if (/^(?:string|text)$/.test(normalized)) return 'String';
    if (/^(?:boolean|bool)$/.test(normalized)) return 'boolean';
    if (/^(?:character|char)$/.test(normalized)) return 'char';
    return 'double';
  }

  function defaultJavaValue(type) {
    return type === 'String' ? '""'
      : type === 'boolean' ? 'false'
        : type === 'char' ? "'\\0'"
          : type === 'double' ? '0.0'
            : '0';
  }

  function parseDeclaration(statement) {
    const match = String(statement || '').match(/^declare\s+(.+?)(?:\s+as\s+([A-Za-z]+))?$/i);
    if (!match) return null;
    return {
      names: match[1].split(',').map(name => sanitizeJavaIdentifier(name.trim())).filter(Boolean),
      type: normalizeJavaType(match[2])
    };
  }

  function parseAssignment(statement) {
    const text = String(statement || '').trim().replace(/^(?:set|let)\s+/i, '');
    const match = text.match(/^([A-Za-z_$][\w$]*)\s*(?:=|←|<-|:=|\bto\b|\bbe\b)\s*(.+)$/i);
    return match ? { name: sanitizeJavaIdentifier(match[1]), expression: match[2] } : null;
  }

  function parseForHeader(statement) {
    const match = String(statement || '').match(
      /^for\s+([A-Za-z_$][\w$]*)\s*(?:=|←|<-|:=)\s*(.+?)\s+to\s+(.+?)(?:\s+step\s+(.+))?$/i
    );
    return match ? {
      variable: sanitizeJavaIdentifier(match[1]),
      start: match[2].trim(),
      end: match[3].trim(),
      step: (match[4] || '1').trim()
    } : null;
  }

  function splitArguments(value) {
    const parts = [];
    let quote = null;
    let depth = 0;
    let start = 0;
    let escaped = false;
    [...String(value || '')].forEach((character, index) => {
      if (escaped) {
        escaped = false;
        return;
      }
      if (character === '\\' && quote) {
        escaped = true;
        return;
      }
      if (quote) {
        if (character === quote) quote = null;
        return;
      }
      if (character === '"' || character === "'") {
        quote = character;
        return;
      }
      if (character === '(' || character === '[') depth += 1;
      else if (character === ')' || character === ']') depth = Math.max(0, depth - 1);
      else if (character === ',' && depth === 0) {
        parts.push(String(value).slice(start, index).trim());
        start = index + 1;
      }
    });
    parts.push(String(value || '').slice(start).trim());
    return parts.filter(part => part.length);
  }

  function javaExpression(expression, condition = false) {
    let result = String(expression || '').trim()
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[×·]/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**')
      .replace(/<>/g, '!=')
      .replace(/\bAND\b/gi, '&&')
      .replace(/\bOR\b/gi, '||')
      .replace(/\bNOT\b/gi, '!')
      .replace(/\bMOD\b/gi, '%')
      .replace(/\bTRUE\b/gi, 'true')
      .replace(/\bFALSE\b/gi, 'false')
      .replace(/\bAbs\s*\(/gi, 'Math.abs(')
      .replace(/\bSqrt\s*\(/gi, 'Math.sqrt(')
      .replace(/\bRound\s*\(/gi, 'Math.round(')
      .replace(/\bFloor\s*\(/gi, 'Math.floor(')
      .replace(/\bCeiling\s*\(/gi, 'Math.ceil(')
      .replace(/\bPow\s*\(/gi, 'Math.pow(')
      .replace(/\bMin\s*\(/gi, 'Math.min(')
      .replace(/\bMax\s*\(/gi, 'Math.max(')
      .replace(/\bSin\s*\(/gi, 'Math.sin(')
      .replace(/\bCos\s*\(/gi, 'Math.cos(')
      .replace(/\bTan\s*\(/gi, 'Math.tan(')
      .replace(/\bLog\s*\(/gi, 'Math.log(');

    result = result.replace(
      /(\([^()]+\)|[A-Za-z_$][\w$]*|-?\d+(?:\.\d+)?)\s*\*\*\s*(\([^()]+\)|[A-Za-z_$][\w$]*|-?\d+(?:\.\d+)?)/g,
      'Math.pow($1, $2)'
    );
    if (condition) {
      result = result.replace(/(?<![<>=!])=(?!=)/g, '==');
      result = result.replace(
        /([A-Za-z_$][\w$]*)\s*(==|!=)\s*("(?:\\.|[^"\\])*")/g,
        (_match, name, operator, literal) =>
          `${operator === '!=' ? '!' : ''}Objects.equals(${name}, ${literal})`
      );
      result = result.replace(
        /("(?:\\.|[^"\\])*")\s*(==|!=)\s*([A-Za-z_$][\w$]*)/g,
        (_match, literal, operator, name) =>
          `${operator === '!=' ? '!' : ''}Objects.equals(${literal}, ${name})`
      );
    }
    return result;
  }

  function inferJavaType(expression) {
    const value = String(expression || '').trim();
    if (/^"(?:\\.|[^"\\])*"$/.test(value)) return 'String';
    if (/^'(?:\\.|[^'\\])'$/.test(value)) return 'char';
    if (/^(?:true|false)$/i.test(value)) return 'boolean';
    if (/^-?\d+$/.test(value)) return 'int';
    if (/^-?(?:\d+\.\d*|\d*\.\d+)$/.test(value)) return 'double';
    return 'double';
  }

  function analyzeVariables(statements) {
    const types = new Map();
    statements.forEach(statement => {
      const declaration = parseDeclaration(statement);
      if (declaration) declaration.names.forEach(name => types.set(name, declaration.type));
      const assignment = parseAssignment(statement);
      if (assignment && !types.has(assignment.name)) {
        types.set(assignment.name, inferJavaType(assignment.expression));
      }
      const loop = parseForHeader(statement);
      if (loop && !types.has(loop.variable)) types.set(loop.variable, 'int');
    });
    statements.forEach(statement => {
      const condition = String(statement).replace(/^(?:else\s+)?if\s+/i, '').replace(/\s+then$/i, '');
      for (const name of types.keys()) {
        if (new RegExp(`\\b${name}\\b\\s*(?:=|==|!=|<>)\\s*["']`, 'i').test(condition)) {
          types.set(name, 'String');
        }
      }
      const input = String(statement).match(/^input\s+([A-Za-z_$][\w$]*)$/i);
      if (input && !types.has(input[1])) {
        const name = sanitizeJavaIdentifier(input[1]);
        const comparedWithText = statements.some(candidate =>
          new RegExp(`\\b${name}\\b\\s*(?:=|==|!=|<>)\\s*["']`, 'i').test(candidate));
        types.set(name, comparedWithText ? 'String' : 'double');
      }
    });
    return types;
  }

  function inputExpression(type) {
    if (type === 'String') return 'input.nextLine()';
    if (type === 'int') return 'Integer.parseInt(input.nextLine().trim())';
    if (type === 'boolean') return 'Boolean.parseBoolean(input.nextLine().trim())';
    if (type === 'char') return 'input.nextLine().charAt(0)';
    return 'Double.parseDouble(input.nextLine().trim())';
  }

  function generateJavaSource(statements, options = {}) {
    const normalized = (statements || []).map(statement => String(statement || '').trim()).filter(Boolean);
    const className = sanitizeJavaClassName(options.projectName);
    const variableTypes = analyzeVariables(normalized);
    const emitted = new Set();
    const lines = [
      '// Generated by Augorithm',
      'import java.util.Objects;',
      'import java.util.Scanner;',
      '',
      `public final class ${className} {`,
      '    private static final Scanner input = new Scanner(System.in);',
      '',
      '    public static void main(String[] args) {'
    ];
    const unit = '    ';
    let indent = 2;
    const push = value => lines.push(unit.repeat(Math.max(0, indent)) + value);

    normalized.forEach(statement => {
      const lower = statement.toLowerCase();
      if (lower === 'start' || lower === 'end' || lower === 'end program' || lower.startsWith('program ')) return;

      if (/^end\s+(?:if|while|for)\b/i.test(statement)) {
        indent = Math.max(2, indent - 1);
        push('}');
        return;
      }
      if (/^else\s+if\b/i.test(statement)) {
        indent = Math.max(2, indent - 1);
        const condition = statement.replace(/^else\s+if\s+|\s+then$/gi, '');
        push(`} else if (${javaExpression(condition, true)}) {`);
        indent += 1;
        return;
      }
      if (/^else$/i.test(statement)) {
        indent = Math.max(2, indent - 1);
        push('} else {');
        indent += 1;
        return;
      }

      const declaration = parseDeclaration(statement);
      if (declaration) {
        declaration.names.forEach(name => {
          emitted.add(name);
          push(`${declaration.type} ${name} = ${defaultJavaValue(declaration.type)};`);
        });
        return;
      }

      const assignment = parseAssignment(statement);
      if (assignment) {
        const type = variableTypes.get(assignment.name) || inferJavaType(assignment.expression);
        const prefix = emitted.has(assignment.name) ? '' : `${type} `;
        emitted.add(assignment.name);
        push(`${prefix}${assignment.name} = ${javaExpression(assignment.expression)};`);
        return;
      }

      const inputMatch = statement.match(/^input\s+([A-Za-z_$][\w$]*)$/i);
      if (inputMatch) {
        const name = sanitizeJavaIdentifier(inputMatch[1]);
        const type = variableTypes.get(name) || 'double';
        const prefix = emitted.has(name) ? '' : `${type} `;
        emitted.add(name);
        push(`${prefix}${name} = ${inputExpression(type)};`);
        return;
      }

      const outputMatch = statement.match(/^output(?:\s+([\s\S]*))?$/i);
      if (outputMatch) {
        const argumentsList = splitArguments(outputMatch[1]);
        const output = argumentsList.map(argument => javaExpression(argument)).join(' + ');
        push(output && output !== '""' ? `System.out.println(${output});` : 'System.out.println();');
        return;
      }

      const ifMatch = statement.match(/^if\s+([\s\S]+?)(?:\s+then)?$/i);
      if (ifMatch) {
        push(`if (${javaExpression(ifMatch[1].replace(/\s+then$/i, ''), true)}) {`);
        indent += 1;
        return;
      }

      const whileMatch = statement.match(/^while\s+([\s\S]+)$/i);
      if (whileMatch) {
        push(`while (${javaExpression(whileMatch[1], true)}) {`);
        indent += 1;
        return;
      }

      const loop = parseForHeader(statement);
      if (loop) {
        const type = variableTypes.get(loop.variable) || 'int';
        const prefix = emitted.has(loop.variable) ? '' : `${type} `;
        emitted.add(loop.variable);
        const start = javaExpression(loop.start);
        const end = javaExpression(loop.end);
        const step = javaExpression(loop.step);
        const numericStep = Number(loop.step);
        const comparison = Number.isFinite(numericStep)
          ? `${loop.variable} ${numericStep < 0 ? '>=' : '<='} ${end}`
          : `((${step}) >= 0 ? ${loop.variable} <= ${end} : ${loop.variable} >= ${end})`;
        push(`for (${prefix}${loop.variable} = ${start}; ${comparison}; ${loop.variable} += ${step}) {`);
        indent += 1;
        return;
      }

      if (/^(?:\/\/|#)/.test(statement)) {
        push(`// ${statement.replace(/^(?:\/\/|#)\s*/, '')}`);
        return;
      }

      push(`// TODO: ${statement.replace(/\*\//g, '* /')}`);
    });

    while (indent > 2) {
      indent -= 1;
      push('}');
    }
    lines.push('    }', '}');
    return lines.join('\n');
  }

  return {
    generateJavaSource,
    javaExpression,
    sanitizeJavaClassName
  };
}));
