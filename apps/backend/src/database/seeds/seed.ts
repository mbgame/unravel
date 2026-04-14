import { AppDataSource } from '../typeorm.config';
import { LevelEntity } from '../../modules/levels/entities/level.entity';
import type { KnotGraph } from '@unravel/shared-types';

/** Par time in milliseconds for difficulty 1 levels (60 seconds). */
const PAR_TIME_EASY_MS = 60_000;
/** Par time in milliseconds for difficulty 5 levels (120 seconds). */
const PAR_TIME_MED_MS = 120_000;
/** Par time in milliseconds for difficulty 8+ levels (180 seconds). */
const PAR_TIME_HARD_MS = 180_000;

/**
 * Build a minimal KnotGraph representing a simple crossed string pair.
 * Used to generate readable sample data without real knot algorithms.
 */
function buildSimpleKnot(crossings: number): KnotGraph {
  const nodes = Array.from({ length: crossings * 2 }, (_, i) => ({
    id: `n${i}`,
    position: {
      x: (i % 4) * 2 - 3,
      y: Math.floor(i / 4) * 2 - 1,
      z: 0,
    },
    isFixed: i === 0 || i === crossings * 2 - 1,
    crossingEdges: i > 0 && i < crossings * 2 - 1 ? [`e${i - 1}`, `e${i}`] : [],
  }));

  const edges = Array.from({ length: crossings * 2 - 1 }, (_, i) => ({
    id: `e${i}`,
    from: `n${i}`,
    to: `n${i + 1}`,
    stringId: i < crossings ? 's0' : 's1',
    over: i % 2 === 0,
  }));

  return {
    nodes,
    edges,
    strings: [
      { id: 's0', color: '#FF6584', nodeSequence: nodes.slice(0, crossings).map((n) => n.id) },
      { id: 's1', color: '#6C63FF', nodeSequence: nodes.slice(crossings).map((n) => n.id) },
    ],
  };
}

/** Sample level definitions for seeding. */
const SAMPLE_LEVELS: Omit<LevelEntity, 'id' | 'createdAt'>[] = [
  { name: 'First Knot',      difficulty: 1, knotData: buildSimpleKnot(1),  parTimeMs: PAR_TIME_EASY_MS, parMoves: 3,  orderIndex: 1,  isDaily: false },
  { name: 'Simple Loop',     difficulty: 1, knotData: buildSimpleKnot(2),  parTimeMs: PAR_TIME_EASY_MS, parMoves: 4,  orderIndex: 2,  isDaily: false },
  { name: 'The Pretzel',     difficulty: 2, knotData: buildSimpleKnot(3),  parTimeMs: PAR_TIME_EASY_MS, parMoves: 6,  orderIndex: 3,  isDaily: false },
  { name: 'Double Cross',    difficulty: 3, knotData: buildSimpleKnot(4),  parTimeMs: PAR_TIME_MED_MS,  parMoves: 8,  orderIndex: 4,  isDaily: false },
  { name: 'Web of Threads',  difficulty: 4, knotData: buildSimpleKnot(5),  parTimeMs: PAR_TIME_MED_MS,  parMoves: 10, orderIndex: 5,  isDaily: false },
  { name: 'Tangled Roots',   difficulty: 5, knotData: buildSimpleKnot(6),  parTimeMs: PAR_TIME_MED_MS,  parMoves: 12, orderIndex: 6,  isDaily: false },
  { name: 'The Gordian',     difficulty: 6, knotData: buildSimpleKnot(7),  parTimeMs: PAR_TIME_MED_MS,  parMoves: 14, orderIndex: 7,  isDaily: false },
  { name: 'Spiral Tangle',   difficulty: 7, knotData: buildSimpleKnot(8),  parTimeMs: PAR_TIME_HARD_MS, parMoves: 18, orderIndex: 8,  isDaily: false },
  { name: 'Celtic Knot',     difficulty: 8, knotData: buildSimpleKnot(10), parTimeMs: PAR_TIME_HARD_MS, parMoves: 22, orderIndex: 9,  isDaily: false },
  { name: 'Chaos Unbound',   difficulty: 10, knotData: buildSimpleKnot(12), parTimeMs: PAR_TIME_HARD_MS, parMoves: 30, orderIndex: 10, isDaily: false },
];

/**
 * Seed the database with sample levels.
 * Safe to re-run — skips levels that already exist by name.
 */
async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.log('Database connected. Starting seed...');

  const levelRepo = AppDataSource.getRepository(LevelEntity);

  for (const levelData of SAMPLE_LEVELS) {
    const existing = await levelRepo.findOneBy({ name: levelData.name });
    if (existing !== null) {
      console.log(`  SKIP: "${levelData.name}" already exists`);
      continue;
    }

    const level = levelRepo.create(levelData);
    await levelRepo.save(level);
    console.log(`  INSERT: "${levelData.name}" (difficulty ${levelData.difficulty})`);
  }

  console.log('Seed complete.');
  await AppDataSource.destroy();
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
