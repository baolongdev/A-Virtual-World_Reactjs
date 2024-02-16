import { Button } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { GraphEditor } from "../scripts/editors/graphEditor";
import { World } from "../scripts/world";
import { Viewport } from "../scripts/viewport";
import { CrossingEditor } from "../scripts/editors/crossingEditor";
import { LightEditor } from "../scripts/editors/lightEditor";
import { ParkingEditor } from "../scripts/editors/parkingEditor";
import { StartEditor } from "../scripts/editors/startEditor";
import { StopEditor } from "../scripts/editors/stopEditor";
import { TargetEditor } from "../scripts/editors/targetEditor";
import { YieldEditor } from "../scripts/editors/yieldEditor";
import { Graph } from "../scripts/math/graph";
import { scale } from "../scripts/math/utils";

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

        const worldString = localStorage.getItem('world');
        const worldInfo = worldString ? JSON.parse(worldString) : null;
        const world = worldInfo ? World.load(worldInfo) : new World(new Graph());
        const graph = world.graph;

        const viewport = new Viewport(canvas, world.zoom, world.offset);

        const tools = {
            graph: { id: "graphBtn", title: "🌐", editor: new GraphEditor(viewport, graph) },
            stop: { id: "stopBtn", title: "🛑", editor: new StopEditor(viewport, world) },
            crossing: { id: "crossingBtn", title: "🚶", editor: new CrossingEditor(viewport, world) },
            start: { id: "startBtn", title: "🚙", editor: new StartEditor(viewport, world) },
            parking: { id: "parkingBtn", title: "🅿️", editor: new ParkingEditor(viewport, world) },
            light: { id: "lightBtn", title: "🚦", editor: new LightEditor(viewport, world) },
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
                        world.zoom = viewport.zoom;
                        world.offset = viewport.offset;

                        const element = document.createElement("a");
                        element.setAttribute(
                            "href",
                            "data:application/json;charset=utf-8," +
                            encodeURIComponent(JSON.stringify(world))
                        );

                        const fileName = "name.world";
                        element.setAttribute("download", fileName);

                        element.click();

                        localStorage.setItem("world", JSON.stringify(world));
                    }}>💾</Button>
                <label htmlFor='fileInput'>
                    Load
                    <input
                        id="fileInput"
                        type="file"
                        accept=".world"
                        onChange={(event) => {
                            const file = event.target.files[0];

                            if (!file) {
                                alert("No file selected.");
                                return;
                            }

                            const reader = new FileReader();
                            reader.readAsText(file);

                            reader.onload = (evt) => {
                                const fileContent = evt.target.result as string;
                                const jsonData = JSON.parse(fileContent);
                                const worldLoadFile = World.load(jsonData);
                                localStorage.setItem("world", JSON.stringify(worldLoadFile));
                                location.reload();
                            }
                        }}
                    />
                </label>

                {Object.values(tools).map((tool, index) => (
                    <Button key={index} onClick={() => {
                        console.log(tool.editor);
                        tool.editor.enable();
                    }}>
                        {tool.title}
                    </Button>
                ))}

            </div>
        </div >
    );
}
