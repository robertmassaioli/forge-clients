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
    file.addImportDeclaration({ moduleSpecifier: '@forge-clients/core', isTypeOnly: true, namedImports: ['ForgeAdapter', 'AuthContext'] });
    file.addImportDeclaration({ moduleSpecifier: './types.gen.js', isTypeOnly: true, namespaceImport: 'Types' });
    file.addStatements("export type * from './types.gen.js';");

    for (const op of spec.operations) {
      this.emitParamsInterface(file, op);
      this.emitOperationFunction(file, op);
    }

    return file.getFullText();
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
        type: this.typeEmitter.irTypeToString(qp.type.kind === 'inline' ? qp.type.type : { kind: 'string' }),
        hasQuestionToken: !qp.required,
      });
    }

    if (op.requestBody) {
      properties.push({
        name: 'body',
        type: this.typeRefToString(op.requestBody),
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
    const returnTypeStr = this.typeRefToString(op.successType);
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
      'const response = await adapter.fetch({',
      `  method: '${op.method}',`,
      '  path,',
      ...(op.queryParams.length > 0 ? ['  queryParams,'] : []),
      ...(op.requestBody ? ['  body: params.body,'] : []),
      '  authContext,',
      '});',
      'if (!response.ok) throw await ForgeApiError.fromResponse(response, path);',
    );

    if (!isVoid) {
      bodyLines.push(`return response.json() as Promise<${returnTypeStr}>;`);
    }

    // Build JSDoc as a plain string to avoid type narrowing issues
    const docParts: string[] = [];
    if (op.summary) docParts.push(op.summary);
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
        { name: 'adapter', type: 'ForgeAdapter' },
        { name: 'authContext', type: 'AuthContext', initializer: "{ type: 'asApp' }" },
        ...(hasParams ? [{ name: 'params', type: `${capitalize(op.operationId)}Params` }] : []),
      ],
      returnType: `Promise<${returnTypeStr}>`,
      statements: bodyLines.join('\n'),
    });
  }

  private typeRefToString(ref: IRTypeRef): string {
    if (ref.kind === 'named') return `Types.${ref.name}`;
    return this.typeEmitter.irTypeToString(ref.type);
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
