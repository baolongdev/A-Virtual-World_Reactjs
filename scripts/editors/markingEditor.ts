import { Stop } from "../markings";
import { getNearestSegment } from "../math";
import { Point, Polygon, Segment } from "../primitives";
import { Viewport } from "../viewport";
import { World } from "../world";

export class MarkingEditor {
    viewport: Viewport
    world: World
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D;
    dragging: boolean;
    mouse: Point;
    intent: Stop;
    markings: Stop[];
    targetSegments: Segment[]

    boundMouseDown: (evt: MouseEvent) => void;
    boundMouseMove: (evt: MouseEvent) => void;
    boundMouseUp: () => void;
    boundContextMenu: (evt: MouseEvent) => void;

    constructor(viewport: Viewport, world: World, targetSegments: Segment[]) {
        this.viewport = viewport;
        this.world = world;

        this.canvas = viewport.canvas;
        this.ctx = this.canvas.getContext("2d");

        this.mouse = null;
        this.intent = null;

        this.targetSegments = targetSegments;

        this.markings = world.markings;
    }

    createMarking(center, directionVector) {
        return center;
    }

    enable() {
        this.addEventListeners();
    }

    disable() {
        this.removeEventListeners();
    }

    private addEventListeners() {
        this.boundMouseDown = this.handleMouseDown.bind(this);
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundContextMenu = (evt) => evt.preventDefault();
        this.canvas.addEventListener('mousedown', this.boundMouseDown)
        this.canvas.addEventListener('mousemove', this.boundMouseMove)
        this.canvas.addEventListener("contextmenu", this.boundContextMenu)
    }

    private removeEventListeners() {
        this.canvas.removeEventListener('mousedown', this.boundMouseDown)
        this.canvas.removeEventListener('mousemove', this.boundMouseMove)
        this.canvas.removeEventListener("contextmenu", this.boundContextMenu)
    }

    private handleMouseDown(evt: MouseEvent) {
        if (evt.button == 0) {// left click
            if (this.intent) {
                this.markings.push(this.intent);
                this.intent = null;
            }
        }
        if (evt.button == 2) {// right click
            for (let i = 0; i < this.markings.length; i++) {
                const poly: Polygon = this.markings[i].poly;
                if (poly.containsPoint(this.mouse)) {
                    this.markings.splice(i, 1);
                    return
                }
            }
        }
    }

    private handleMouseMove(evt: MouseEvent) {
        this.mouse = this.viewport.getMouse(evt, true);
        const seg: Segment = getNearestSegment(
            this.mouse,
            this.targetSegments,
            10 * this.viewport.zoom
        )
        if (seg) {
            const proj = seg.projectPoint(this.mouse);
            if (proj.offset >= 0 && proj.offset <= 1) {
                this.intent = this.createMarking(
                    proj.point,
                    seg.directionVector()
                )
            } else {
                this.intent = null;
            }
        } else {
            this.intent = null;
        }
    }

    display() {
        if (this.intent) {
            this.intent.draw(this.ctx);
        }
    }
}