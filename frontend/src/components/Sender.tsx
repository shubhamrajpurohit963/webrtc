import { useEffect, useState } from "react";

export function Sender() {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = () => {
      setWs(ws);
      ws.send(JSON.stringify({ type: "sender" }));
    };
  }, []);

  const send = async () => {
    if (!ws) return;
    const webrtc = new RTCPeerConnection();

    webrtc.onnegotiationneeded = () => {
      webrtc.createOffer().then(async (offer) => {
        await webrtc.setLocalDescription(offer);
        ws?.send(
          JSON.stringify({ type: "createOffer", sdp: webrtc.localDescription })
        );
      });
    };

    webrtc.onicecandidate = (event) => {
      if (event.candidate) {
        ws?.send(
          JSON.stringify({ type: "iceCandidate", candidate: event.candidate })
        );
      }
    };

    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.type === "createAnswer") {
        webrtc.setRemoteDescription(data.sdp);
      } else if (data.type === "iceCandidate") {
        webrtc.addIceCandidate(data.candidate);
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    webrtc.addTrack(stream.getVideoTracks()[0]);
  };

  return (
    <div>
      <h1>Sender</h1>
      <button onClick={send}>Send</button>
    </div>
  );
}
