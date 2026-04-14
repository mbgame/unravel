export interface KnotNode {
    id: string;
    position: {
        x: number;
        y: number;
        z: number;
    };
    isFixed: boolean;
    crossingEdges: string[];
}
export interface KnotEdge {
    id: string;
    from: string;
    to: string;
    stringId: string;
    over: boolean;
}
export interface KnotString {
    id: string;
    color: string;
    nodeSequence: string[];
}
export interface KnotGraph {
    nodes: KnotNode[];
    edges: KnotEdge[];
    strings: KnotString[];
}
export type GamePhase = 'IDLE' | 'PLAYING' | 'PAUSED' | 'COMPLETE';
export interface Level {
    id: string;
    name: string;
    difficulty: number;
    knotData: KnotGraph;
    parTimeMs: number;
    parMoves: number;
    orderIndex: number;
    isDaily: boolean;
    createdAt: string;
}
export interface Score {
    id: string;
    userId: string;
    levelId: string;
    score: number;
    timeMs: number;
    moves: number;
    hintsUsed: number;
    createdAt: string;
}
