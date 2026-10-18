"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** Any camera the browser exposes: laptop webcam, phone/tablet front or back camera, USB/kiosk camera. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [cameraId, setCameraId] = useState<string>("")
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
  }, [])

  const start = useCallback(
    async (deviceId?: string) => {
      setError(null)
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera needs a secure connection (HTTPS or localhost) and a supported browser.")
        return
      }
      stop()
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        // Labels are only available after permission is granted
        const all = await navigator.mediaDevices.enumerateDevices()
        setCameras(all.filter((d) => d.kind === "videoinput"))
        setCameraId(stream.getVideoTracks()[0]?.getSettings().deviceId || deviceId || "")
        setActive(true)
      } catch (err: any) {
        setError(err?.name === "NotAllowedError" ? "Camera permission was denied." : `Camera unavailable: ${err?.message || err}`)
      }
    },
    [stop]
  )

  useEffect(() => stop, [stop])

  return { videoRef, cameras, cameraId, active, error, start, stop }
}

/** Current video frame as a canvas (for still capture / group snap). */
export function grabFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext("2d")!.drawImage(video, 0, 0)
  return canvas
}
