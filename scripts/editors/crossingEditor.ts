import { Point } from "../primitives/point";
import { Viewport } from "../viewport";
import { World } from "../world";
import { MarkingEditor } from "./markingEditor";
import { Crossing } from "../markings/crossing";



export class CrossingEditor extends MarkingEditor {
    constructor(viewport: Viewport, world: World) {
        super(viewport, world, world.graph.segments);
    }
    createMarking(center: Point, directionVector: Point) {
        return new Crossing(
            center,
            directionVector,
            this.world.roadWidth,
            this.world.roadWidth / 2,
        )
    }
}