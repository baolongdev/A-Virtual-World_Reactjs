import { Graph } from "./math/graph";
import { add, distance, lerp, scale } from "./math/utils";
import { Envelope } from "./primitives/envelope";
import { Point } from "./primitives/point";
import { Polygon } from "./primitives/polygon";
import { Segment } from "./primitives/segment";

export class World {
    graph: Graph
    roadWidth: number
    roadRoundness: number
    envelopes: Envelope[]
    intersections: Point[]
    roadBorders: Segment[]
    buildingWidth: number
    buildingMinLength: number
    spacing: number
    buildings: Polygon[]
    trees: Point[]
    treeSize: number

    constructor(
        graph: Graph,
        roadWidth: number = 100,
        roadRoundness: number = 10,
        buildingWidth: number = 150,
        buildingMinLength: number = 150,
        spacing: number = 50,
        treeSize: number = 160
    ) {
        this.graph = graph;
        this.roadWidth = roadWidth;
        this.roadRoundness = roadRoundness;
        this.buildingWidth = buildingWidth
        this.buildingMinLength = buildingMinLength
        this.spacing = spacing
        this.treeSize = treeSize

        this.envelopes = [];
        this.roadBorders = [];
        this.buildings = [];
        this.trees = [];

        this.generate();
    }

    generate() {
        this.envelopes.length = 0;
        for (const seg of this.graph.segments) {
            this.envelopes.push(
                new Envelope(seg, this.roadWidth, this.roadRoundness)
            );
        }

        this.roadBorders = Polygon.union(this.envelopes.map((e) => e.poly));
        this.buildings = this.generateBuildings();
        this.trees = this.generateTrees();
    }

    private generateTrees() {
        const points = [
            ...this.roadBorders.map((s) => [s.p1, s.p2]).flat(),
            ...this.buildings.map((b) => b.points).flat()
        ]
        const left = Math.min(...points.map((p) => p.x));
        const right = Math.max(...points.map((p) => p.x));
        const top = Math.min(...points.map((p) => p.y));
        const bottom = Math.max(...points.map((p) => p.y));

        const illegalPolys = [
            ...this.buildings,
            ...this.envelopes.map((e) => e.poly)
        ];

        const trees: Point[] = [];
        let tryCount = 0;
        while (tryCount < 100) {
            const p = new Point(
                lerp(left, right, Math.random()),
                lerp(bottom, top, Math.random()),
            );

            // check if tree inside or nearby building / road
            let keep = true;
            for (const poly of illegalPolys) {
                if (poly.containsPoint(p) || poly.distanceToPoint(p) < this.treeSize / 2) {
                    keep = false;
                    break;
                }
            }

            // check if tree too close to other trees
            if (keep) {
                for (const tree of trees) {
                    if (distance(tree, p) < this.treeSize) {
                        keep = false;
                    }
                }
            }

            // avoiding trees in the middle of nowhere
            if (keep) {
                let closeToSomething = false;
                for (const poly of illegalPolys) {
                    if (poly.distanceToPoint(p) < this.treeSize * 2) {
                        closeToSomething = true;
                        break
                    }
                }
                keep = closeToSomething;
            }

            if (keep) {
                trees.push(p);
                tryCount = 0;
            }
            tryCount++;
        }
        return trees;
    }
    private generateBuildings() {
        const tmpEnvelopes: Envelope[] = [];
        for (const seg of this.graph.segments) {
            tmpEnvelopes.push(
                new Envelope(
                    seg,
                    this.roadWidth + this.buildingWidth + this.spacing * 2,
                    this.roadRoundness
                )
            )
        }

        const guides: Segment[] = Polygon.union(tmpEnvelopes.map((e) => e.poly))

        for (let i = 0; i < guides.length; i++) {
            const seg = guides[i];
            if (seg.length() < this.buildingMinLength) {
                guides.splice(i, 1);
                i--;
            }
        }

        const supports: Segment[] = [];
        for (let seg of guides) {
            const len = seg.length() + this.spacing;
            const buildingCount = Math.floor(
                len / (this.buildingMinLength + this.spacing)
            )
            const buildingLength = len / buildingCount - this.spacing;

            const dir = seg.directionVector();

            let q1 = seg.p1;
            let q2 = add(q1, scale(dir, buildingLength));
            supports.push(new Segment(q1, q2));

            for (let i = 2; i <= buildingCount; i++) {
                q1 = add(q2, scale(dir, this.spacing));
                q2 = add(q1, scale(dir, buildingLength));
                supports.push(new Segment(q1, q2));
            }
        }

        const bases: Polygon[] = [];
        for (const seg of supports) {
            bases.push(new Envelope(seg, this.buildingWidth).poly);
        }

        const eps = 0.001;
        for (let i = 0; i < bases.length - 1; i++) {
            for (let j = i + 1; j < bases.length; j++) {
                if (
                    bases[i].intersectsPoly(bases[j]) ||
                    bases[i].distanceToPoly(bases[j]) < this.spacing - eps
                ) {
                    bases.splice(j, 1);
                    j--;
                }
            }
        }

        return bases;
    }

    draw(ctx) {
        for (const env of this.envelopes) {
            env.draw(ctx, { fill: "#BBB", stroke: "#BBB", lineWidth: 15 });
        }
        for (const seg of this.graph.segments) {
            seg.draw(ctx, { color: "white", width: 4, dash: [10, 10] });
        }
        for (const seg of this.roadBorders) {
            seg.draw(ctx, { color: 'white', width: 4 });
        }
        for (const tree of this.trees) {
            tree.draw(ctx, { size: this.treeSize, color: "rgba(0,0,0,0.5)" });
        }
        for (const bld of this.buildings) {
            bld.draw(ctx);
        }
    }
}