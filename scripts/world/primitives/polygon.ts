import { getIntersection, average, getRandomColor, dot, normalize, subtract } from "../math/utils";
import { Point } from "./point";
import { Segment } from "./segment";

export class Polygon {
    points: Point[]
    segments: Segment[]
    id: number

    constructor(points: Point[]) {
        this.points = points
        this.segments = []

        for (let i = 1; i <= points.length; i++) {
            this.segments.push(
                new Segment(points[i - 1], points[i % points.length])
            );
        }
    }

    static load(info: Polygon) {
        return new Polygon(
            info.points.map((i) => new Point(i.x, i.y))
        );
    }

    static union(polys: Polygon[]) {
        Polygon.multiBreak(polys);
        const keptSegments: Segment[] = [];
        for (let i = 0; i < polys.length; i++) {
            for (const seg of polys[i].segments) {
                let keep = true;
                for (let j = 0; j < polys.length; j++) {
                    if (i != j) {
                        if (polys[j].containsSegment(seg)) {
                            keep = false;
                            break;
                        }
                    }
                }
                if (keep) {
                    keptSegments.push(seg);
                }
            }
        }
        let end = performance.now();
        return keptSegments;
    }

    static multiBreak(polys: Polygon[]) {
        for (let i = 0; i < polys.length - 1; i++) {
            for (let j = i + 1; j < polys.length; j++) {
                Polygon.break(polys[i], polys[j]);
            }
        }
    }
    static break(poly1: Polygon, poly2: Polygon) {
        const segs1 = poly1.segments;
        const segs2 = poly2.segments;
        for (let i = 0; i < segs1.length; i++) {
            for (let j = 0; j < segs2.length; j++) {
                const int = getIntersection(
                    segs1[i].p1,
                    segs1[i].p2,
                    segs2[j].p1,
                    segs2[j].p2
                );

                if (int && int.offset != 1 && int.offset != 0) {
                    const point = new Point(int.x, int.y);
                    let aux = segs1[i].p2;
                    segs1[i].p2 = point;
                    segs1.splice(i + 1, 0, new Segment(point, aux));
                    aux = segs2[j].p2;
                    segs2[j].p2 = point;
                    segs2.splice(j + 1, 0, new Segment(point, aux));
                }
            }
        }
    }

    simplify() {
        for (let i = 1; i < this.points.length; i++) {
            const prev = this.points[i - 1];
            const cur = this.points[i];
            const next = this.points[(i + 1) % this.points.length];
            if (dot(normalize(subtract(cur, prev)), normalize(subtract(next, cur))) >= 0.99) {
                this.points.splice(i, 1);
                i--;
            }
        }
        this.segments = [];
        for (let i = 1; i <= this.points.length; i++) {
            this.segments.push(
                new Segment(this.points[i - 1], this.points[i % this.points.length])
            );
        }
    }

    area() {
        let area = 0;
        for (let i = 0; i < this.points.length; i++) {
            let nextI = i + 1;
            if (nextI == this.points.length) {
                nextI = 0;
            }
            area += this.points[i].x * this.points[nextI].y;
            area -= this.points[i].y * this.points[nextI].x;
        }
        area = Math.abs(area) / 2
        return area;
    }

    distanceToPoint(point: Point) {
        return Math.min(...this.segments.map((s) => s.distanceToPoint(point)))
    }

    distanceToPoly(poly: Polygon) {
        return Math.min(...this.points.map((p) => poly.distanceToPoint(p)))
    }

    intersectsSegment(seg) {
        for (let s1 of this.segments) {
            if (getIntersection(s1.p1, s1.p2, seg.p1, seg.p2)) {
                return true;
            }
        }
        return false;
    }

    // containsSegment(seg: Segment) {
    //     if (this.containsPoint(seg.p1)) {
    //         return true;
    //     }
    //     if (this.containsPoint(seg.p2)) {
    //         return true;
    //     }
    //     return false;
    // }

    containsPoly(poly: Polygon) {
        for (const p of poly.points) {
            if (this.containsPoint(p)) {
                return true;
            }
        }
        return false;
    }

    intersectsPoly(poly: Polygon) {
        for (let s1 of this.segments) {
            for (let s2 of poly.segments) {
                if (getIntersection(s1.p1, s1.p2, s2.p1, s2.p2)) {
                    return true;
                }
            }
        }
        return false;
    }

    containsSegment(seg: Segment) {
        const midpoint = average(seg.p1, seg.p2);
        return this.containsPoint(midpoint);
    }

    containsPoint(point: Point) {
        const outerPoint = new Point(-1000, -1000);
        let intersectionCount = 0;
        for (const seg of this.segments) {
            const int = getIntersection(outerPoint, point, seg.p1, seg.p2);
            if (int) {
                intersectionCount++;
            }
        }
        return intersectionCount % 2 == 1;
    }

    drawSegments(ctx: CanvasRenderingContext2D) {
        for (const seg of this.segments) {
            seg.draw(ctx, { color: getRandomColor(), width: 5 });
        }
    }

    draw(ctx: CanvasRenderingContext2D, { stroke = "blue", lineWidth = 2, fill = "rgba(0,0,255,0.3", join = "miter" }: { stroke?: string, lineWidth?: number, fill?: string, join?: CanvasLineJoin } = {}) {
        ctx.beginPath();
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = join;
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}