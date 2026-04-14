/**
 * Jest global teardown — runs once after all e2e test suites complete.
 */

export default async function globalTeardown(): Promise<void> {
  // Nothing to clean up globally — each test file handles its own app lifecycle
}
