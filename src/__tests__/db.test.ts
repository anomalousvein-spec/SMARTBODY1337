import { describe, it, expect, } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../db/database';

describe('Database', () => {
  it('should be able to add and retrieve a weight entry', async () => {
    const entry = {
      user_id: 'test_user',
      date: '2023-01-01',
      weight: 80,
      unit: 'kg' as const
    };
    const id = await db.weights.add(entry);
    const retrieved = await db.weights.get(id!);
    expect(retrieved?.weight).toBe(80);
  });
});
