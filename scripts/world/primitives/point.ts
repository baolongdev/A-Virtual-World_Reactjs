//! Done
export class Point {
    x: number
    y: number
    id: number
    prev: Point
    cost: number
    visited: boolean
    follow: boolean

    constructor(x: number, y: number, round = true, id?: number) {
        if (round) {
            this.x = Math.round(x);
            this.y = Math.round(y);
        } else {
            this.x = x;
            this.y = y;
        }
        this.id = id;
    }

    hash() {
        return Math.floor(this.x * 10000000 + this.y);
    }

    equals(point: Point) {
        return this.x === point.x && this.y === point.y;
    }

    draw(ctx: CanvasRenderingContext2D,
        { size = 18, color = 'black', outline = false, fill = false }: { size?: number, color?: string, outline?: boolean, fill?: boolean } = {}) {
        const rad = size / 2;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(this.x, this.y, rad, 0, Math.PI * 2);
        ctx.fill();
        if (outline) {
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "yellow";
            ctx.arc(this.x, this.y, rad * 0.6, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (fill) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, rad * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = "yellow";
            ctx.fill();
        }
    }
}