import { Crossing } from "../markings";
import { Point } from "../primitives";
import { Viewport } from "../viewport";
import { World } from "..";
import { MarkingEditor } from "./markingEditor";
//! Done

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