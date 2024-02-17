import { Start } from "../markings";
import { Point } from "../primitives";
import { Viewport } from "../viewport";
import { World } from "..";
import { MarkingEditor } from "./markingEditor";


export class StartEditor extends MarkingEditor {
    constructor(viewport: Viewport, world: World) {
        super(viewport, world, world.laneGuides);
    }
    createMarking(center: Point, directionVector: Point) {
        return new Start(
            center,
            directionVector,
            this.world.roadWidth / 2,
            this.world.roadWidth / 2,
        )
    }
}