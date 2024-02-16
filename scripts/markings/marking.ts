import { translate, angle } from "../math/utils"
import { Envelope } from "../primitives/envelope"
import { Point } from "../primitives/point"
import { Polygon } from "../primitives/polygon"
import { Segment } from "../primitives/segment"
import { Yield } from "./yield"


export class Marking {
    center: Point
    directionVector: Point
    width: number
    height: number
    support: Segment
    poly: Polygon
    border: Segment
    borders: Segment[]
    state: string
    type: string
    img: HTMLImageElement

    constructor(center: Point, directionVector: Point, width: number, height: number) {
        this.center = center;
        this.directionVector = directionVector;
        this.width = width;
        this.height = height;

        this.support = new Segment(
            translate(center, angle(directionVector), height / 2),
            translate(center, angle(directionVector), -height / 2)
        )
        this.poly = new Envelope(this.support, width, 0).poly;
        this.type = "marking";
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.poly.draw(ctx);
    }
}