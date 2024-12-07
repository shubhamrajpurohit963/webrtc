
import { useEffect, useRef, useState } from "react";

export function Receiver() {
  // const [ws, setWs] = useState<WebSocket | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = () => {
      // setWs(ws);
      console.log("connected");

      ws.send(JSON.stringify({ type: "receiver" }));
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      console.log(data);
      let webrtc = new RTCPeerConnection();
      if (data.type === "createOffer") {
        webrtc.setRemoteDescription(data.sdp);

        webrtc.onicecandidate = (event) => {
          if (event.candidate) {
            ws?.send(
              JSON.stringify({
                type: "iceCandidate",
                candidate: event.candidate,
              })
            );
          }
        };

        webrtc.ontrack = (event) => {
          console.log(event);
          if (videoRef.current) {
            videoRef.current.srcObject = new MediaStream([event.track]);
          }
        };

        webrtc.createAnswer().then(async (answer) => {
          console.log(answer);
          await webrtc.setLocalDescription(answer);
          ws?.send(
            JSON.stringify({
              type: "createAnswer",
              sdp: webrtc.localDescription,
            })
          );
        });
      } else if (data.type === "iceCandidate") {
        webrtc.addIceCandidate(data.candidate);
      }
    };
  }, []);

  return (
    <div>
      <h1>Receiver</h1>
      <video
        id="video"
        width="320"
        height="240"
        ref={videoRef}
        controls
      ></video>
    </div>
  );
}
