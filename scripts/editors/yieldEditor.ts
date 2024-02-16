import { Yield } from "../markings/yield";
import { Point } from "../primitives/point";
import { Viewport } from "../viewport";
import { World } from "../world";
import { MarkingEditor } from "./markingEditor";

export class YieldEditor extends MarkingEditor {
    constructor(viewport: Viewport, world: World) {
        super(viewport, world, world.laneGuides);
    }
    createMarking(center: Point, directionVector: Point) {
        return new Yield(
            center,
            directionVector,
            this.world.roadWidth / 2,
            this.world.roadWidth / 2,
        )
    }
}