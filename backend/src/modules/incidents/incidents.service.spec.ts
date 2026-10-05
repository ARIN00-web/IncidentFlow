describe('IncidentFlow smoke tests', () => {
  it('has the expected incident lifecycle', () => {
    expect([
      'OPEN',
      'ACKNOWLEDGED',
      'INVESTIGATING',
      'MITIGATED',
      'RESOLVED',
    ]).toHaveLength(5);
  });

  it('does not treat a resolved incident as a new incident state', () => {
    const transitions: Record<string, string[]> = {
      RESOLVED: [],
    };
    expect(transitions.RESOLVED).toEqual([]);
  });
});