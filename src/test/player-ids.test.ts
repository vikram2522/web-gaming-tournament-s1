import { describe, expect, it } from 'vitest';
import { validatePlayerIds } from '../lib/tournament';

describe('player ID requirement', () => {
  it('requires an ID for every player', () => {
    expect(() => validatePlayerIds(['123', ''], ['a', 'b'])).toThrow('Enter the in-game ID for every player');
  });

  it('requires the same number of IDs as players', () => {
    expect(() => validatePlayerIds(['123'], ['a', 'b'])).toThrow('Enter the in-game ID for every player');
  });

  it('accepts one ID per player and trims them', () => {
    expect(validatePlayerIds([' 123 ', '456'], ['a', 'b'])).toEqual(['123', '456']);
  });

  it('still requires 4 or 5 players', () => {
    expect(() => validatePlayerIds(['123'], ['a'])).toThrow('Enter 4 or 5 players');
  });
});
