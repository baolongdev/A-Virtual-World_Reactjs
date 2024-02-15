import { Graph } from "./math/graph";
import { getNearestPoint } from "./math/utils";
import { Point } from "./primitives/point";
import { Segment } from "./primitives/segment";

export class GraphEditor {
    canvas: HTMLCanvasElement;
    graph: Graph;
    ctx: CanvasRenderingContext2D;
    selected: Point;
    hovered: Point;
    dragging: boolean;
    mouse: Point;

    constructor(canvas, graph) {
        this.canvas = canvas;
        this.graph = graph;

        this.ctx = this.canvas.getContext("2d");

        this.selected = null;
        this.hovered = null;
        this.dragging = false;
        this.mouse = null

        this.addEventListeners();
    }
    private addEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
        this.canvas.addEventListener("contextmenu", (evt) => evt.preventDefault())
        this.canvas.addEventListener("mouseup", () => this.dragging = false)
    }

    private handleMouseMove(evt) {
        this.mouse = new Point(evt.offsetX, evt.offsetY);
        this.hovered = getNearestPoint(this.mouse, this.graph.points, 10);
        if (this.dragging == true) {
            this.selected.x = this.mouse.x;
            this.selected.y = this.mouse.y;
        }
    }
    private handleMouseDown(evt) {
        if (evt.button == 2) { // right click
            if (this.selected) {
                this.selected = null;
            } else if (this.hovered) {
                this.removePoint(this.hovered);
            }
        }
        if (evt.button == 0) { // left click
            if (this.hovered) {
                this.select(this.hovered)
                this.dragging = true;
                return;
            }
            this.graph.addPoint(this.mouse);
            this.select(this.mouse)
            this.hovered = this.mouse;
        }
    }

    private select(point: Point) {
        if (this.selected) {
            this.graph.tryAddSegment(new Segment(this.selected, point))
        }
        this.selected = point;
    }

    private removePoint(point: Point) {
        this.graph.removePoint(point);
        this.hovered = null;
        if (this.selected == point) {
            this.selected = null;
        }
    }

    display() {
        this.graph.draw(this.ctx);
        if (this.hovered) {
            this.hovered.draw(this.ctx, { fill: true })
        }
        if (this.selected) {
            const intent = this.hovered ? this.hovered : this.mouse;
            new Segment(this.selected, this.mouse).draw(this.ctx, { dash: [3, 3] });
            this.selected.draw(this.ctx, { outline: true });
        }
    }
}

