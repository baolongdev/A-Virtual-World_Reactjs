import { Viewport } from "../viewport";
import { Graph, getNearestPoint } from "../math";
import { Point, Segment } from "../primitives";

export class GraphEditor {
    viewport: Viewport;
    canvas: HTMLCanvasElement;
    graph: Graph;
    ctx: CanvasRenderingContext2D;
    selected: Point;
    hovered: Point;
    dragging: boolean;
    mouse: Point;

    boundMouseDown: (evt: MouseEvent) => void;
    boundMouseMove: (evt: MouseEvent) => void;
    boundMouseUp: () => void;
    boundMouseContextMenu: (evt: MouseEvent) => void;

    constructor(viewport: Viewport, graph: Graph) {
        this.viewport = viewport;
        this.canvas = viewport.canvas;
        this.graph = graph;

        this.ctx = this.canvas.getContext("2d");

        this.selected = null;
        this.hovered = null;
        this.dragging = false;
        this.mouse = null;
    }

    enable() {
        this.addEventListeners();
    }

    disable() {
        this.removeEventListeners();
        this.selected = null;
        this.hovered = null;
    }


    private addEventListeners() {
        this.boundMouseDown = this.handleMouseDown.bind(this);
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundMouseUp = () => this.dragging = false;
        this.boundMouseContextMenu = (evt) => evt.preventDefault();


        this.canvas.addEventListener('mousedown', this.boundMouseDown)
        this.canvas.addEventListener('mousemove', this.boundMouseMove)
        this.canvas.addEventListener("mouseup", this.boundMouseUp)
        this.canvas.addEventListener("contextmenu", this.boundMouseContextMenu)
    }

    private removeEventListeners() {
        this.canvas.removeEventListener('mousedown', this.boundMouseDown)
        this.canvas.removeEventListener('mousemove', this.boundMouseMove)
        this.canvas.removeEventListener("mouseup", this.boundMouseUp)
        this.canvas.removeEventListener("contextmenu", this.boundMouseContextMenu)
    }

    private handleMouseMove(evt: MouseEvent) {
        this.mouse = this.viewport.getMouse(evt, true);
        this.hovered = getNearestPoint(this.mouse, this.graph.points, 10 * this.viewport.zoom);
        if (this.dragging == true) {
            this.selected.x = this.mouse.x;
            this.selected.y = this.mouse.y;
        }
    }

    private handleMouseDown(evt: MouseEvent) {
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

    dispose() {
        this.graph.dispose();
        this.selected = null;
        this.hovered = null;
    }

    display() {
        this.graph.draw(this.ctx);
        if (this.hovered) {
            this.hovered.draw(this.ctx, { fill: true })
        }
        if (this.selected) {
            const intent = this.hovered ? this.hovered : this.mouse;
            new Segment(this.selected, intent).draw(this.ctx, { dash: [3, 3] });
            this.selected.draw(this.ctx, { outline: true });
        }
    }
}

