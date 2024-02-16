import { Button } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { CrossingEditor, LightEditor, ParkingEditor, StopEditor, StartEditor, TargetEditor, YieldEditor } from "../scripts/editors";
import { GraphEditor } from "../scripts/editors/graphEditor";
import { Graph, scale } from "../scripts/math";
import { World } from "../scripts/world";
import { Viewport } from "../scripts/viewport";


type ToolsState = {
    [key: string]: {
        title: string;
        editor: any;
    };
};

export default function Home() {
    const canvasRef = useRef(null);
    const [viewport, setViewport] = useState<Viewport>(null);
    const [world, setWorld] = useState<World>(null);
    const [graph, setGraph] = useState<Graph>(null);
    const [tools, setTools] = useState<ToolsState>({})

    useEffect(() => {
        const canvas = canvasRef.current as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 600;

        const graphString = localStorage.getItem('graph');
        const graphInfo = graphString ? JSON.parse(graphString) : null;
        const graph = graphInfo ? Graph.load(graphInfo) : new Graph();
        const world = new World(graph);
        const viewport = new Viewport(canvas);
        const tools = {
            crossing: { id: "crossingBtn", title: "🚶", editor: new CrossingEditor(viewport, world) },
            graph: { id: "graphBtn", title: "🌐", editor: new GraphEditor(viewport, graph) },
            light: { id: "lightBtn", title: "🚦", editor: new LightEditor(viewport, world) },
            parking: { id: "parkingBtn", title: "🅿️", editor: new ParkingEditor(viewport, world) },
            stop: { id: "stopBtn", title: "🛑", editor: new StopEditor(viewport, world) },
            start: { id: "startBtn", title: "🚙", editor: new StartEditor(viewport, world) },
            target: { id: "targetBtn", title: "🎯", editor: new TargetEditor(viewport, world) },
            yield: { id: "yieldBtn", title: "⚠️", editor: new YieldEditor(viewport, world) },
        };
        setGraph(graph);
        setWorld(world);
        setViewport(viewport);
        setTools(tools);

        let oldGraphHash = graph.hash();
        animate();

        function animate() {
            viewport.reset();
            if (graph.hash() != oldGraphHash) {
                world.generate();
                oldGraphHash = graph.hash();
            }
            const viewPoint = scale(viewport.getOffset(), -1);
            world.draw(ctx, viewPoint);
            ctx.globalAlpha = 0.2;
            for (const tool of Object.values(tools)) {
                tool.editor.display();
            }
            requestAnimationFrame(animate);
        }
    }, [])


    return (
        <div className=" min-h-screen w-screen bg-black items-center flex flex-col">
            <h1 className="text-white text-xl">Hello world</h1>
            <canvas ref={canvasRef} className="bg-green-600" />
            <div className="controls">
                <Button
                    id="dispose"
                    onClick={() => {
                        tools.graph.editor.dispose()
                        world.markings.length = 0;
                    }}>🗑️</Button>
                <Button
                    id="save"
                    onClick={() => {
                        localStorage.setItem('graph', JSON.stringify(graph))
                    }}>💾</Button>

                {Object.values(tools).map((tool, index) => (
                    <Button key={index} onClick={() => {
                        console.log(tool.editor);
                        tool.editor.enable();
                    }}>
                        {tool.title}
                    </Button>
                ))}

            </div>
        </div>
    );
}
