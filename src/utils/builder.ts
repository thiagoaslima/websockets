/**
 * Creates an edge id given a source, target, and type.
 */
export function createEdgeId(
  source: string,
  target: string,
  type: string
): string {
  return `${source}:${type}:${target}`;
}
