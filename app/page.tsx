"use client";

import { useRef, useState } from "react";

export default function Home() {
  const [logMsg, setLogMsg] = useState<string>("");

  let log = (_msg: string) => {
    setLogMsg(_msg);
  };

  const rtcPeerRef = useRef<RTCPeerConnection | undefined>(undefined);
  const mediaStreamRef = useRef<MediaStream | undefined>(undefined);
  const [sdpInput, setSdpInput] = useState<string>();
  const [sdpOutput, setSdpOutput] = useState<string>("");
  const [iceInput, setIceInput] = useState<string>();
  const [iceOutput, setIceOutput] = useState<string>("");
  const iceCandidates = useRef<RTCIceCandidate[]>([]);

  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  let connect = async () => {
    rtcPeerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    rtcPeerRef.current.oniceconnectionstatechange = (e) =>
      log(rtcPeerRef.current?.iceConnectionState ?? "undefined");

    rtcPeerRef.current!.onicecandidate = (event) => {
      if (event.candidate === null) {
        return;
      }

      iceCandidates.current.push(event.candidate);
      setIceOutput(JSON.stringify(iceCandidates.current, null, 2));
    };

    // Create and get media stream
    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
      video: { width: 800, height: 600 },
    });

    if (selfVideoRef.current !== null) {
      selfVideoRef.current.srcObject = mediaStreamRef.current;
    }

    mediaStreamRef.current
      .getTracks()
      .forEach((track) =>
        rtcPeerRef.current?.addTrack(track, mediaStreamRef.current!)
      );

    rtcPeerRef.current.ontrack = (event) => {
      console.log("ontrack", event);
      console.log("stream", event.streams.length);
      if (videoRef.current !== null) {
        videoRef.current.srcObject = event.streams[0];
        videoRef.current.autoplay = true;
        videoRef.current.controls = true;
      }
    };
  };

  let SDPOutput = async () => {
    let sessionDescription = await rtcPeerRef.current?.createOffer();
    await rtcPeerRef.current?.setLocalDescription(sessionDescription);
    setSdpOutput(JSON.stringify(sessionDescription, null, 2));
  };

  let SDPInput = async () => {
    const sessionDescription: RTCSessionDescriptionInit = JSON.parse(
      sdpInput ?? ""
    );
    await rtcPeerRef.current?.setRemoteDescription(sessionDescription);

    // Offer SDPの場合はAnswer SDPを作成
    if (sessionDescription.type === "offer") {
      const sessionDescription = await rtcPeerRef.current?.createAnswer();
      await rtcPeerRef.current?.setLocalDescription(sessionDescription);
      setSdpOutput(JSON.stringify(sessionDescription, null, 2));
    }
  };

  let IceInput = async () => {
    const iceCandidates: RTCIceCandidateInit[] = JSON.parse(iceInput ?? "");
    for (const iceCandidate of iceCandidates) {
      await rtcPeerRef.current?.addIceCandidate(iceCandidate);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col">
        <video width={800} height={600} autoPlay muted ref={selfVideoRef} />
        <video width={800} height={600} autoPlay muted ref={videoRef} />
        <button onClick={connect}>Connect</button>
        <button onClick={SDPOutput}>SDP Output</button>
        <textarea readOnly value={sdpOutput}></textarea>
        <button onClick={SDPInput}>SDP Input</button>
        <textarea onChange={(e) => setSdpInput(e.target.value)}></textarea>
        <h1>ICE Output</h1>
        <textarea readOnly value={iceOutput}></textarea>
        <button onClick={IceInput}>Ice Input</button>
        <textarea onChange={(e) => setIceInput(e.target.value)}></textarea>
        <div>{logMsg}</div>
      </div>
    </main>
  );
}
