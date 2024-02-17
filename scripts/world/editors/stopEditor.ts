import { Stop } from "../markings";
import { Point } from "../primitives";
import { Viewport } from "../viewport";
import { World } from "..";
import { MarkingEditor } from "./markingEditor";
//! Done

export class StopEditor extends MarkingEditor {
    constructor(viewport: Viewport, world: World) {
        super(viewport, world, world.laneGuides);
    }
    createMarking(center: Point, directionVector: Point) {
        return new Stop(
            center,
            directionVector,
            this.world.roadWidth / 2,
            this.world.roadWidth / 2,
        )
    }
}