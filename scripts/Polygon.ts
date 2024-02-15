import { Point } from "./primitives/point";

export class Polygon {
    points: Point[]
    constructor(points) {
        this.points = points;
    }

    draw(ctx: CanvasRenderingContext2D, { stroke = 'blue', lineWidth = 2, fill = 'rgba(0,0,255,0.3' }: { stroke?: string, lineWidth?: number, fill?: string } = {}) {
        ctx.beginPath()
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

    }
}