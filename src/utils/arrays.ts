/**
 * Generates a range given a head and tail
 */
export function* range(head: number, tail: number) {
  for (let i = head; i <= tail; i++) {
    yield i;
  }
}
