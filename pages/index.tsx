import { useEffect, useRef, useState } from "react";
import { Graph } from "../scripts/math/graph";
import { Point } from "../scripts/primitives/point";
import { Segment } from "../scripts/primitives/segment";
import { Button } from "@geist-ui/core";
import { GraphEditor } from "../scripts/GraphEditor";
import { Viewport } from "../scripts/Viewport";
import { Polygon } from "../scripts/Polygon";

export default function Home() {
  const canvasRef = useRef(null);
  const [graphEditor, setGraphEditor] = useState(null);
  const [graph, setGraph] = useState(null);


  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 500;

    const graphString = localStorage.getItem('graph');
    const graphInfo = graphString ? JSON.parse(graphString) : null;
    const graph = graphInfo
      ? Graph.load(graphInfo)
      : new Graph();
    const viewport = new Viewport(canvas);
    const graphEditor = new GraphEditor(viewport, graph);


    setGraph(graph);
    setGraphEditor(graphEditor);

    animate();

    function animate() {
      viewport.reset();
      graphEditor.display();
      // new Polygon(graph.points).draw(ctx);
      new Envelope(graph.segments[0], 80).draw(ctx);
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
