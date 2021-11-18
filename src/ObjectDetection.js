import React, { useState, useEffect, useRef } from "react";
import "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { useDropzone } from "react-dropzone";
import "./App.css";

const thumb = {
  display: "inline-flex",
  marginBottom: 8,
  marginRight: 8,
  width: 500,
  height: 500,
  padding: 4,
  boxSizing: "border-box",
};

const thumbInner = {
  display: "flex",
  minWidth: 0,
  overflow: "hidden",
};

const img = {
  display: "block",
  width: "auto",
  height: "100%",
};

export default function ObjectDetection() {
  const [files, setFiles] = useState([]);
  const [model, setModel] = useState(null);
  const canvasRef = useRef(null);
  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    },
  });
  const imageChange = async (e) => {
    const ctx = canvasRef.current.getContext("2d");

    const imageWidth = e.target.naturalWidth;
    const imageHeight = e.target.naturalHeight;

    canvasRef.current.width = e.target.width;
    canvasRef.current.height = e.target.height;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (imageWidth > imageHeight) {
      ctx.drawImage(
        e.target,
        (imageWidth - imageHeight) / 2,
        0,
        imageHeight,
        imageHeight,
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
    } else {
      ctx.drawImage(
        e.target,
        0,
        (imageHeight - imageWidth) / 2,
        imageWidth,
        imageWidth,
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
    }

    const predictions = await model.detect(canvasRef.current);

    for (let prediction of predictions) {
      ctx.strokeStyle = "green";
      ctx.lineWidth = 4;
      ctx.strokeRect(
        prediction.bbox[0],
        prediction.bbox[1],
        prediction.bbox[2],
        prediction.bbox[3]
      );

      const textWidth = ctx.measureText(prediction.class).width;

      ctx.fillStyle = "green";
      ctx.fillRect(prediction.bbox[0], prediction.bbox[1], textWidth + 20, 20);

      ctx.fillStyle = "black";
      ctx.fillText(
        prediction.class + " " + prediction.score.toFixed(2) * 100 + "%",
        prediction.bbox[0] + 5,
        prediction.bbox[1] + 5
      );
    }
  };

  const thumbs = files.map((file) => (
    <div style={thumb} key={file.name}>
      <div style={thumbInner}>
        <img src={file.preview} style={img} onLoad={imageChange} alt="Object" />
      </div>
    </div>
  ));

  useEffect(() => {
    cocoSsd.load().then((model) => {
      setModel(model);
    });

    URL.revokeObjectURL(files.preview);
  }, [files]);

  return (
    <section className="container App">
      <header className="App-header">
        <p>Drag 'n' drop some files here, or click to select files</p>
        <div {...getRootProps({ className: "dropzone" })}>
          <input {...getInputProps()} />
          {files && <aside>{thumbs}</aside>}
          <canvas id="canvas" ref={canvasRef}></canvas>
        </div>
      </header>
    </section>
  );
}
