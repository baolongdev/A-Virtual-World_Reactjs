import { subtract, add, scale } from "./math/utils";
import { Point } from "./primitives/point";

export class Viewport {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    zoom: number;
    center: Point;
    offset: Point;
    drag: { start: Point, end: Point, offset: Point, active: boolean };

    constructor(canvas: HTMLCanvasElement, zoom: number = 1, offset: Point = null) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");

        this.zoom = zoom;
        this.center = new Point(canvas.width / 2, canvas.height / 2);
        this.offset = offset ? offset : scale(this.center, -1);

        this.drag = {
            start: new Point(0, 0),
            end: new Point(0, 0),
            offset: new Point(0, 0),
            active: false,
        }

        this.addEventListeners();
    }

    reset() {
        this.ctx.restore();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.center.x, this.center.y);
        this.ctx.scale(1 / this.zoom, 1 / this.zoom);
        const offset = this.getOffset();
        this.ctx.translate(offset.x, offset.y);
    }

    getMouse(evt: MouseEvent, subtractDragOffset = false) {
        const p = new Point(
            (evt.offsetX - this.center.x) * this.zoom - this.offset.x,
            (evt.offsetY - this.center.y) * this.zoom - this.offset.y,
        )
        return subtractDragOffset ? subtract(p, this.drag.offset) : p;
    }

    getOffset() {
        return add(this.offset, this.drag.offset);
    }

    private addEventListeners() {
        this.canvas.addEventListener('mousewheel', this.handleMouseWheel.bind(this))
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    }

    private handleMouseDown(evt: MouseEvent) {
        if (evt.button === 2 && evt.ctrlKey) { //! Ctrl + right button
            this.drag.start = this.getMouse(evt);
            this.drag.active = true;
        }
    }

    private handleMouseMove(evt: MouseEvent) {
        if (this.drag.active) {
            this.drag.end = this.getMouse(evt);
            this.drag.offset = subtract(this.drag.end, this.drag.start);
        }
    }

    private handleMouseUp(evt: MouseEvent) {
        if (this.drag.active) {
            this.offset = add(this.offset, this.drag.offset);
            this.drag = {
                start: new Point(0, 0),
                end: new Point(0, 0),
                offset: new Point(0, 0),
                active: false,
            }
        }
    }

    private handleMouseWheel(evt: WheelEvent) {
        const dir = Math.sign(evt.deltaY);
        const step = 0.1;
        this.zoom += dir * step;
        this.zoom = Math.max(1, Math.min(5, this.zoom));
    }
}