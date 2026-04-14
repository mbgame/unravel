/**
 * KnotMesh — the main interactive 3D object.
 * Reads from knotStore and renders all StringSegments and KnotNodes
 * within a Group that can be rotated by the interaction hook.
 */

'use client';

import React, { useRef, useMemo, forwardRef, memo } from 'react';
import * as THREE from 'three';
import { useKnotStore } from '../../../stores/knotStore';
import { KnotGraph } from '../../../lib/game/knotGraph';
import { StringSegment } from './StringSegment';
import { KnotNodeMesh } from './KnotNodeMesh';

/**
 * Renders all string segments and crossing nodes for the active knot.
 * The outer Group ref is forwarded so the interaction hook can apply
 * rotation and scale transforms directly to the group.
 *
 * Reads: knotStore.graph, knotStore.selectedNodeId, knotStore.collectedNodeIds
 */
export const KnotMesh = memo(
  forwardRef<THREE.Group>(function KnotMesh(_, ref) {
    const graph = useKnotStore((s) => s.graph);
    const selectedNodeId = useKnotStore((s) => s.selectedNodeId);
    const collectedNodeIds = useKnotStore((s) => s.collectedNodeIds);

    const knotGraph = useMemo(
      () => (graph ? KnotGraph.fromJSON(graph) : null),
      [graph],
    );

    // Build a map from stringId → color for quick lookup
    const stringColorMap = useMemo(() => {
      if (!graph) return new Map<string, string>();
      return new Map(graph.strings.map((s) => [s.id, s.color]));
    }, [graph]);

    // Build string paths: stringId → Vector3[]
    const stringPaths = useMemo(() => {
      if (!knotGraph || !graph) return new Map<string, THREE.Vector3[]>();
      const map = new Map<string, THREE.Vector3[]>();
      for (const str of graph.strings) {
        map.set(str.id, knotGraph.getStringPath(str.id));
      }
      return map;
    }, [knotGraph, graph]);

    // O(1) lookup for collected nodes
    const collectedSet = useMemo(() => new Set(collectedNodeIds), [collectedNodeIds]);

    if (!graph) return null;

    return (
      <group ref={ref}>
        {/* Render one StringSegment per string's full path */}
        {graph.strings.map((str) => {
          const path = stringPaths.get(str.id);
          if (!path || path.length < 2) return null;
          return (
            <StringSegment
              key={str.id}
              points={path}
              color={str.color}
              isSelected={false}
            />
          );
        })}

        {/* Render a coin node at each crossing node */}
        {graph.nodes.map((node) => {
          const nodeString = graph.strings.find((s) =>
            s.nodeSequence.includes(node.id),
          );
          const color = nodeString ? stringColorMap.get(nodeString.id) ?? '#FFD700' : '#FFD700';

          return (
            <KnotNodeMesh
              key={node.id}
              nodeId={node.id}
              position={node.position}
              color={color}
              isSelected={node.id === selectedNodeId}
              isFixed={node.isFixed}
              collected={collectedSet.has(node.id)}
            />
          );
        })}
      </group>
    );
  }),
);
