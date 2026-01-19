"use client"

import { useEffect, useRef } from "react"
import { useRecording } from "@/contexts/recording-context"
import { useAuth } from "@/contexts/auth-context"

export function LiveStreamBroadcaster() {
    const { session } = useAuth()
    const { recordingState } = useRecording()

    // Use a ref to access current streams in callbacks without triggering re-runs
    const streamsRef = useRef({ webcamStream: recordingState.webcamStream, screenStream: recordingState.screenStream })

    useEffect(() => {
        streamsRef.current = {
            webcamStream: recordingState.webcamStream,
            screenStream: recordingState.screenStream
        }
    }, [recordingState.webcamStream, recordingState.screenStream])

    useEffect(() => {
        if (!session?.sessionId) return

        let pc: RTCPeerConnection | null = null
        let socketInstance: any = null

        const initSocket = async () => {
            const { socket } = await import("@/lib/socket-client")
            if (!socket.connected) socket.connect()
            socketInstance = socket

            socket.on('request-stream', async () => {
                console.log("Broadcaster: Received request-stream")

                if (pc) {
                    pc.close()
                }

                pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                })

                // Add Tracks
                // Priority: Screen (0), Webcam (1)
                const { screenStream, webcamStream } = streamsRef.current

                if (screenStream) {
                    screenStream.getTracks().forEach(track => {
                        if (pc && screenStream) pc.addTrack(track, screenStream)
                    })
                }

                if (webcamStream) {
                    webcamStream.getTracks().forEach(track => {
                        if (pc && webcamStream) pc.addTrack(track, webcamStream)
                    })
                }

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('ice-candidate', {
                            targetSessionId: session.sessionId,
                            candidate: event.candidate
                        })
                    }
                }

                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)

                socket.emit('offer', {
                    targetSessionId: session.sessionId,
                    sdp: offer
                })

                socket.on('answer', async (data: any) => {
                    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
                })

                socket.on('ice-candidate', async (data: any) => {
                    if (pc && data.candidate) await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
                })
            })
        }

        initSocket()

        return () => {
            if (pc) pc.close()
            if (socketInstance) {
                socketInstance.off('request-stream')
                socketInstance.off('answer')
                socketInstance.off('ice-candidate')
            }
        }
    }, [session?.sessionId])

    return null // Headless component
}
