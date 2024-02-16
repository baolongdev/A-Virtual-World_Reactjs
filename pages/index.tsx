import { useEffect, useRef, useState } from "react";
import { Graph } from "../scripts/math/graph";
import { Button } from "@geist-ui/core";
import { GraphEditor } from "../scripts/graphEditor";
import { Viewport } from "../scripts/viewport";
import { World } from "../scripts/world";

export default function Home() {
  const canvasRef = useRef(null);
  const [graphEditor, setGraphEditor] = useState(null);
  const [graph, setGraph] = useState(null);


  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 600;

    const graphString = localStorage.getItem('graph');
    const graphInfo = graphString ? JSON.parse(graphString) : null;
    const graph = graphInfo
      ? Graph.load(graphInfo)
      : new Graph();
    const world = new World(graph);

    const viewport = new Viewport(canvas);
    const graphEditor = new GraphEditor(viewport, graph);


    setGraph(graph);
    setGraphEditor(graphEditor);

    animate();

    function animate() {
      viewport.reset();
      world.generate();
      world.draw(ctx);
      ctx.globalAlpha = 0.2;
      graphEditor.display();
      requestAnimationFrame(animate);
    }
  }, [])


  return (
    <div className=" min-h-screen w-screen bg-black items-center flex flex-col">
      <h1 className="text-white text-xl">Hello world</h1>
      <canvas ref={canvasRef} className="bg-green-600" />
      <div className="controls">
        <Button placeholder={"dispose"} onClick={(e) => {
          graphEditor.dispose();
        }}>🗑️</Button>
        <Button placeholder={"save"} onClick={(e) => {
          localStorage.setItem('graph', JSON.stringify(graph))
        }}>💾</Button>
      </div>
    </div>
  );
}
