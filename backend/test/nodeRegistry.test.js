const { chooseNextNodeIds, validateConditionExpression, executeNode } = require('../src/services/execution/nodeRegistry');

describe('nodeRegistry', () => {
  test('validates a condition expression', () => {
    expect(() => validateConditionExpression('payload.count > 1')).not.toThrow();
  });

  test('throws on invalid condition expression syntax', () => {
    expect(() => validateConditionExpression('payload.count >')).toThrow();
  });

  test('routes to the false branch when a labeled false edge exists', () => {
    const node = { id: 'cond-1', data: { nodeType: 'Condition' } };
    const edges = [
      { source: 'cond-1', target: 'node-true', label: 'true' },
      { source: 'cond-1', target: 'node-false', label: 'false' },
    ];

    const next = chooseNextNodeIds(node, edges, { output: { result: false } });
    expect(next).toEqual(['node-false']);
  });

  test('throws when a false condition has no false branch', () => {
    const node = { id: 'cond-1', data: { nodeType: 'Condition' } };
    const edges = [{ source: 'cond-1', target: 'node-next', label: 'Next' }];

    expect(() => chooseNextNodeIds(node, edges, { output: { result: false } })).toThrow('Condition not met');
  });

  test('defaults delay nodes to 1 second when no duration is provided', async () => {
    const originalSetTimeout = global.setTimeout;
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0;
    });

    try {
      const result = await executeNode({ id: 'delay-1', data: { nodeType: 'Delay' } }, { foo: 'bar' }, {});
      expect(result.output.delayMs).toBe(1000);
    } finally {
      setTimeoutSpy.mockRestore();
      global.setTimeout = originalSetTimeout;
    }
  });

  test('uses the configured delay when provided', async () => {
    const originalSetTimeout = global.setTimeout;
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0;
    });

    try {
      const result = await executeNode({ id: 'delay-2', data: { nodeType: 'Delay', delayMs: 5000 } }, { foo: 'bar' }, {});
      expect(result.output.delayMs).toBe(5000);
    } finally {
      setTimeoutSpy.mockRestore();
      global.setTimeout = originalSetTimeout;
    }
  });
});
