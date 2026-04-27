/** A targeted patch for a single known spec defect */
export interface SpecPatch {
  description: string;
  /** JSON Pointer path segments to the target value (RFC 6901 without leading /) */
  path: string[];
  operation: 'add' | 'replace' | 'remove' | 'merge';
  value?: unknown;
}

/** Apply a list of patches to a spec object in-place */
export function applyPatches(spec: Record<string, unknown>, patches: SpecPatch[]): void {
  for (const patch of patches) {
    try {
      applyPatch(spec, patch);
    } catch (err) {
      // Warn but don't fail — the spec may have already been fixed upstream
      console.warn(`  WARN: patch failed (${patch.description}): ${(err as Error).message}`);
    }
  }
}

function applyPatch(root: Record<string, unknown>, patch: SpecPatch): void {
  const { path, operation, value } = patch;
  if (path.length === 0) throw new Error('Empty patch path');

  let current: Record<string, unknown> = root;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]!;
    const next = current[segment];
    if (next === null || typeof next !== 'object') {
      throw new Error(`Path segment '${segment}' not found or not an object at depth ${i}`);
    }
    current = next as Record<string, unknown>;
  }

  const lastKey = path[path.length - 1]!;

  switch (operation) {
    case 'add':
    case 'replace':
      current[lastKey] = value;
      break;
    case 'remove':
      delete current[lastKey];
      break;
    case 'merge': {
      const existing = current[lastKey];
      if (existing !== null && typeof existing === 'object') {
        current[lastKey] = { ...existing as Record<string, unknown>, ...value as Record<string, unknown> };
      } else {
        current[lastKey] = value;
      }
      break;
    }
  }
}
