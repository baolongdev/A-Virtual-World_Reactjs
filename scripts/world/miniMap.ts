import { Graph, scale } from "./math";
import { Point } from "./primitives";

export class MiniMap {
    canvas: HTMLCanvasElement
    graph: Graph
    size: number
    ctx: CanvasRenderingContext2D

    constructor(canvas: HTMLCanvasElement, graph: Graph, size: number) {
        this.canvas = canvas
        this.graph = graph
        this.size = size

        canvas.width = size;
        canvas.height = size;
        this.ctx = canvas.getContext("2d");
    }

    update(viewPoint: Point) {
        this.ctx.clearRect(0, 0, this.size, this.size);

        const scaler = 0.05;
        const scaledViewPoint = scale(viewPoint, -scaler);
        this.ctx.save();
        this.ctx.translate(
            scaledViewPoint.x + this.size / 2,
            scaledViewPoint.y + this.size / 2
        );
        this.ctx.scale(scaler, scaler);
        for (const seg of this.graph.segments) {
            seg.draw(this.ctx, { width: 3 / scaler, color: "white" });
        }
        this.ctx.restore();
        new Point(this.size / 2, this.size / 2)
            .draw(this.ctx, { color: "blue", outline: true });
    }
}