/**
 * Emits sdk.gen.ts from the IR.
 * Generates one named, tree-shakeable async function per operation.
 */

import { Project } from 'ts-morph';
import type { SourceFile } from 'ts-morph';
import type { IRSpec, IROperation, IRTypeRef } from '../ir/IRTypes.js';
import { TypeEmitter } from './TypeEmitter.js';

export class SdkEmitter {
  private typeEmitter = new TypeEmitter();

  emit(spec: IRSpec, banner: string): string {
    const project = new Project({ useInMemoryFileSystem: true });
    const file = project.createSourceFile('sdk.gen.ts');

    file.addStatements(banner);
    file.addStatements('/* eslint-disable */');
    file.addImportDeclaration({ moduleSpecifier: '@forge-clients/core', namedImports: ['ForgeApiError'] });
    file.addImportDeclaration({ moduleSpecifier: '@forge-clients/core', isTypeOnly: true, namedImports: ['BoundClient'] });
    file.addImportDeclaration({ moduleSpecifier: './types.gen.js', isTypeOnly: true, namespaceImport: 'Types' });
    // Note: 'export type *' is TS 5.0+ and not supported by Forge's webpack bundler (ts-loader).
    // Use 'export *' which works for both types and values in the Forge build context.
    file.addStatements("export * from './types.gen.js';");

    for (const op of spec.operations) {
      this.emitParamsInterface(file, op);
      this.emitOperationFunction(file, op);
    }

    // Prepend @ts-nocheck as the very first line — must be before any other content
    // for TypeScript to honour it as a file-level directive. ts-morph's addStatements
    // appends after imports so we prepend to the final string instead.
    return '// @ts-nocheck\n' + file.getFullText();
  }

  private emitParamsInterface(file: SourceFile, op: IROperation): void {
    const hasParams = op.pathParams.length > 0 || op.queryParams.length > 0 || op.requestBody;
    if (!hasParams) return;

    const properties: Array<{ name: string; type: string; hasQuestionToken: boolean }> = [];

    if (op.pathParams.length > 0) {
      properties.push({
        name: 'path',
        type: `{ ${op.pathParams.map(p => `${p.name}: string`).join('; ')} }`,
        hasQuestionToken: false,
      });
    }

    for (const qp of op.queryParams) {
      properties.push({
        name: qp.name,
        type: this.typeEmitter.irTypeToString(qp.type.kind === 'inline' ? qp.type.type : { kind: 'string' }, 'Types'),
        hasQuestionToken: !qp.required,
      });
    }

    if (op.requestBody) {
      properties.push({
        name: 'body',
        type: this.typeRefToString(op.requestBody, 'Types'),
        hasQuestionToken: true,
      });
    }

    file.addInterface({
      name: `${capitalize(op.operationId)}Params`,
      isExported: true,
      properties,
    });
  }

  private emitOperationFunction(file: SourceFile, op: IROperation): void {
    const hasParams = op.pathParams.length > 0 || op.queryParams.length > 0 || op.requestBody;
    const returnTypeStr = this.typeRefToString(op.successType, 'Types');
    const isVoid = returnTypeStr === 'void';

    // Build resolved path string
    let resolvedPath = op.path;
    for (const p of op.pathParams) {
      resolvedPath = resolvedPath.replace(`{${p.name}}`, `\${params.path.${p.name}}`);
    }
    const pathExpr = op.pathParams.length > 0
      ? '`' + resolvedPath + '`'
      : `'${resolvedPath}'`;

    const bodyLines: string[] = [`const path = ${pathExpr};`];

    if (op.queryParams.length > 0) {
      bodyLines.push('const queryParams = {');
      for (const qp of op.queryParams) bodyLines.push(`  ${qp.name}: params.${qp.name},`);
      bodyLines.push('};');
    }

    bodyLines.push(
      'const response = await client.adapter.fetch({',
      `  method: '${op.method}',`,
      '  path,',
      ...(op.queryParams.length > 0 ? ['  queryParams,'] : []),
      ...(op.requestBody ? ['  body: params.body,'] : []),
      '  authContext: client.authContext,',
      '});',
      'if (!response.ok) throw await ForgeApiError.fromResponse(response, path);',
    );

    if (!isVoid) {
      bodyLines.push(`return response.json() as Promise<${returnTypeStr}>;`);
    }

    // Build JSDoc as a plain string to avoid type narrowing issues
    const sanitizeDoc = (s: string) => s.replace(/\*\//g, '* /');
    const docParts: string[] = [];
    if (op.summary) docParts.push(sanitizeDoc(op.summary));
    if (op.forgeScopes.asApp.length > 0) docParts.push(`@forge-scopes-asApp ${op.forgeScopes.asApp.join(', ')}`);
    if (op.forgeScopes.asUser.length > 0) docParts.push(`@forge-scopes-asUser ${op.forgeScopes.asUser.join(', ')}`);
    if (op.deprecated) docParts.push('@deprecated');
    const docs = docParts.length > 0 ? [docParts.join('\n')] : [];

    file.addFunction({
      name: op.operationId,
      isAsync: true,
      isExported: true,
      docs,
      parameters: [
        { name: 'client', type: 'BoundClient' },
        ...(hasParams ? [{ name: 'params', type: `${capitalize(op.operationId)}Params` }] : []),
      ],
      returnType: `Promise<${returnTypeStr}>`,
      statements: bodyLines.join('\n'),
    });
  }

  private typeRefToString(ref: IRTypeRef, namespace?: string): string {
    if (ref.kind === 'named') return `Types.${ref.name}`;
    return this.typeEmitter.irTypeToString(ref.type, namespace);
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
