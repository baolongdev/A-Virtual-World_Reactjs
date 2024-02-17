import { perpendicular, add, scale } from "../math";
import { Point, Segment } from "../primitives";
import { Marking } from "./marking";
//! Done

export class Crossing extends Marking {
    constructor(center: Point, directionVector: Point, width: number, height: number) {
        super(center, directionVector, width, height);
        this.borders = [this.poly.segments[0], this.poly.segments[2]];
        this.type = "crossing";
    }

    draw(ctx: CanvasRenderingContext2D) {
        const perp = perpendicular(this.directionVector);
        const line: Segment = new Segment(
            add(this.center, scale(perp, this.width / 2)),
            add(this.center, scale(perp, -this.width / 2))
        )
        line.draw(ctx, {
            width: this.height,
            color: 'white',
            dash: [11, 11]
        });
    }
}