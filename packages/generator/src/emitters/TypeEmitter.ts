/**
 * Emits types.gen.ts from the IR.
 * Generates TypeScript interfaces and type aliases for all schemas in the spec.
 */

import { Project, SourceFile, Writers } from 'ts-morph';
import type { IRSpec, IRType, IRNamedType } from '../ir/IRTypes.js';

export class TypeEmitter {
  emit(spec: IRSpec, banner: string): string {
    const project = new Project({ useInMemoryFileSystem: true });
    const file = project.createSourceFile('types.gen.ts');

    file.addStatements(banner);
    file.addStatements('/* eslint-disable */');
    file.addStatements('// prettier-ignore');

    for (const [, namedType] of spec.types) {
      this.emitNamedType(file, namedType);
    }

    return file.getFullText();
  }

  private emitNamedType(file: SourceFile, named: IRNamedType): void {
    const { name, type, description } = named;

    if (type.kind === 'object') {
      file.addInterface({
        name,
        isExported: true,
        docs: description ? [{ description: description.replace(/\*\//g, '* /') }] : [],
        properties: type.properties.map(prop => ({
          // Quote property names starting with digits (e.g. "16x16") — TypeScript requires
          // numeric-starting identifiers to be quoted in interface property signatures
          name: /^\d/.test(prop.name) ? `"${prop.name}"` : prop.name,
          type: this.irTypeToString(prop.type),
          hasQuestionToken: !prop.required,
          isReadonly: prop.readonly,
          docs: [
            ...(prop.description ? [{ description: prop.description }] : []),
            ...(prop.deprecated ? [{ tags: [{ tagName: 'deprecated' }] }] : []),
          ],
        })),
      });
    } else {
      file.addTypeAlias({
        name,
        isExported: true,
        docs: description ? [{ description: description.replace(/\*\//g, '* /') }] : [],
        type: this.irTypeToString(type),
      });
    }
  }

  irTypeToString(type: IRType, namespace?: string): string {
    const ns = namespace ? `${namespace}.` : '';
    switch (type.kind) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'null': return 'null';
      case 'unknown': return 'unknown';
      case 'void': return 'void';
      case 'literal': return JSON.stringify(type.value);
      case 'array': return `Array<${this.irTypeToString(type.items, namespace)}>`;
      case 'record': return `Record<string, ${this.irTypeToString(type.values, namespace)}>`;
      case 'ref': return `${ns}${type.name}`;
      case 'union': return type.types.map(t => this.irTypeToString(t, namespace)).join(' | ');
      case 'intersection': return type.types.map(t => this.irTypeToString(t, namespace)).join(' & ');
      case 'object': {
        if (type.properties.length === 0) return 'Record<string, unknown>';
        const props = type.properties.map(p =>
          `${p.readonly ? 'readonly ' : ''}${/^\d/.test(p.name) ? `'${p.name}'` : p.name}${p.required ? '' : '?'}: ${this.irTypeToString(p.type)}`
        ).join('; ');
        return `{ ${props} }`;
      }
    }
  }
}
