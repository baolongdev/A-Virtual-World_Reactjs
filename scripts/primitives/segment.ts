import { Point } from "./point";

export class Segment {
    p1: Point;
    p2: Point;

    constructor(p1: Point, p2: Point) {
        this.p1 = p1;
        this.p2 = p2;
    }

    equals(seg: Segment) {
        return this.includes(seg.p1) && this.includes(seg.p2);
    }

    includes(point: Point) {
        return this.p1.equals(point) || this.p2.equals(point);
    }

    draw(ctx: CanvasRenderingContext2D, { width = 2, color = "black", dash = [] }: { width?: number, color?: string, dash?: number[] } = {}) {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.setLineDash(dash);
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}