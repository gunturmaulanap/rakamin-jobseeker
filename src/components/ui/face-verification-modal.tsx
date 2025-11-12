"use client";

import * as React from "react";
import { X, Camera, CheckCircle, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handDetectionService, type HandDetection } from "@/lib/hand-detection";
import Image from "next/image";

interface FaceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (imageFile: File) => void;
}

export function FaceVerificationModal({
  isOpen,
  onClose,
  onSuccess,
}: FaceVerificationModalProps) {
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [detectionStatus, setDetectionStatus] = React.useState<
    "detecting" | "detected" | "not-detected"
  >("detecting");
  const [handPosition, setHandPosition] = React.useState({ x: 50, y: 50 }); // Position in percentage
  const [isHandDetected, setIsHandDetected] = React.useState(false); // Hand presence detection
  const [handDetection, setHandDetection] =
    React.useState<HandDetection | null>(null);
  const [poseInstruction, setPoseInstruction] = React.useState<string>(
    "Lift your hand to start"
  );
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const detectionIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const capturedImageRef = React.useRef<string | null>(null);

  // Start camera and initialize model when modal opens
  React.useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
      initializeHandDetection();
      handDetectionService.startPoseSequence();
    }
    return () => {
      stopPoseDetection();
      stopCamera();
      handDetectionService.dispose();
    };
  }, [isOpen, capturedImage]);

  // Set up direct capture callback
  React.useEffect(() => {
    if (isOpen && !capturedImage) {
      // Set callback untuk direct trigger dari hand-detection.ts
      handDetectionService.setCaptureCallback(() => {
        if (!isCapturing) {
          triggerCapture();
        } else {
        }
      });

      // Cleanup callback saat unmount
      return () => {
        handDetectionService.clearCaptureCallback();
      };
    }
  }, [isOpen, capturedImage, isCapturing]);

  // Update pose instruction and handle countdown
  React.useEffect(() => {
    if (isOpen && !capturedImage) {
      let countdownStartTime: number | null = null;

      const updatePoseState = () => {
        const instruction = handDetectionService.getCurrentPoseInstruction();
        setPoseInstruction(instruction);

        const countdownState = handDetectionService.getCountdownState();

        if (countdownState.isCountingDown) {
          setCountdown(countdownState.countdownValue);
          // Start timing when countdown begins
          if (countdownStartTime === null) {
            countdownStartTime = Date.now();
          }

          // 🔥 SAFETY NET: Direct timing check as fallback
          const elapsed = Date.now() - countdownStartTime;
          if (elapsed >= 3100 && !isCapturing) {
            // 3.1 seconds safety margin

            triggerCapture();
          }
        } else {
          setCountdown(null);
          countdownStartTime = null; // Reset when countdown stops
        }

        // Primary capture trigger (sebagai backup)
        if (countdownState.shouldCapture && !isCapturing) {
          triggerCapture();
        } else {
          // Debug hanya ketika countdown aktif untuk mengurangi spam
          if (
            countdownState.isCountingDown &&
            countdownState.countdownValue <= 1
          ) {
          }
        }
      };

      const interval = setInterval(updatePoseState, 50); // Normal polling (callback sebagai primary trigger)
      return () => clearInterval(interval);
    }
  }, [isOpen, capturedImage, isCapturing]);

  // Get pose status for UI
  const getPoseStatus = () => {
    const poseState = handDetectionService.getPoseState();
    const detection = handDetection;

    const poses = [
      { id: 1, name: "pose1", src: "/detector/satu.svg" },
      { id: 2, name: "pose2", src: "/detector/dua.svg" },
      { id: 3, name: "pose3", src: "/detector/tiga.svg" },
    ];

    return poses.map((pose) => {
      const isCompleted = pose.id < poseState.currentPoseStep;
      const isCurrent =
        pose.id === poseState.currentPoseStep && poseState.currentPoseStep <= 3;
      const isCountingDown = poseState.isCountingDown;

      let borderColor = "border-gray-200";
      let status = "pending";

      if (isCountingDown) {
        borderColor = "border-green-500";
        status = "completed";
      } else if (isCompleted) {
        borderColor = "border-green-500";
        status = "completed";
      } else if (isCurrent) {
        if (
          detection &&
          detection.handDetected &&
          detection.fingerCount === pose.id
        ) {
          borderColor = detection.isStable
            ? "border-green-500"
            : "border-yellow-500";
          status = detection.isStable ? "completed" : "detecting";
        } else {
          borderColor = "border-yellow-500";
          status = "detecting";
        }
      }

      return {
        ...pose,
        borderColor,
        status,
      };
    });
  };

  // Initialize hand detection model
  const initializeHandDetection = async () => {
    try {
      await handDetectionService.initialize();
      // Wait for video to be ready before starting detection
      const waitForVideo = () => {
        if (videoRef.current && videoRef.current.readyState === 4) {
          startPoseDetection();
        } else {
          setTimeout(waitForVideo, 100);
        }
      };
      waitForVideo();
    } catch (error) {
      console.error("Failed to initialize hand detection:", error);
      // Fallback to demo mode
      setTimeout(startPoseDetection, 2000);
    }
  };

  // Start pose detection using new pose sequence logic
  const startPoseDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    setDetectionStatus("detecting");

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      try {
        if (handDetectionService.isReady()) {
          const detection = await handDetectionService.detectHand(
            videoRef.current
          );
          setHandDetection(detection);

          if (detection.handDetected) {
            setIsHandDetected(true);

            // Calculate hand position
            if (detection.keypoints && detection.keypoints.length > 0) {
              const videoRect = videoRef.current.getBoundingClientRect();
              const poseState = handDetectionService.getPoseState();

              let targetX = 50;
              let targetY = 50;

              if (detection.fingerCount > 0 && poseState.targetPose > 0) {
                // Focus on fingertips when correct pose is detected
                let fingertips: any[] = [];

                if (detection.fingerCount === 1) {
                  fingertips = [detection.keypoints[8]].filter(Boolean);
                } else if (detection.fingerCount === 2) {
                  fingertips = [
                    detection.keypoints[8],
                    detection.keypoints[12],
                  ].filter(Boolean);
                } else if (detection.fingerCount === 3) {
                  fingertips = [
                    detection.keypoints[8],
                    detection.keypoints[12],
                    detection.keypoints[16],
                  ].filter(Boolean);
                }

                if (fingertips.length > 0) {
                  const avgX =
                    fingertips.reduce((sum, tip) => sum + tip.x, 0) /
                    fingertips.length;
                  const avgY =
                    fingertips.reduce((sum, tip) => sum + tip.y, 0) /
                    fingertips.length;

                  targetX = (avgX / videoRect.width) * 100;
                  targetY = (avgY / videoRect.height) * 100;
                }
              } else if (detection.boundingBox) {
                targetX =
                  ((detection.boundingBox.x + detection.boundingBox.width / 2) /
                    videoRect.width) *
                  100;
                targetY =
                  ((detection.boundingBox.y +
                    detection.boundingBox.height / 2) /
                    videoRect.height) *
                  100;
              }

              setHandPosition({
                x: Math.max(15, Math.min(85, targetX)),
                y: Math.max(15, Math.min(75, targetY)),
              });
            }

            // Update detection status based on pose sequence
            if (detection.isStable) {
              setDetectionStatus("detected");
            } else if (
              detection.fingerCount ===
              handDetectionService.getPoseState().targetPose
            ) {
              setDetectionStatus("detecting");
            } else {
              setDetectionStatus("not-detected");
            }
          } else {
            setIsHandDetected(false);
            setDetectionStatus("detecting");
          }
        }
      } catch (error) {
        // Silent error handling to avoid console spam
      }
    }, 100);
  };

  const stopPoseDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setDetectionStatus("detecting");
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check your camera permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
  };

  const triggerCapture = async () => {
    if (!isCapturing) {
      console.log("📸 Auto-capture after 3-2-1 countdown");
      setIsCapturing(true);

      // Stop pose detection but keep video running
      stopPoseDetection();

      // Wait a moment for countdown to finish visually, then capture
      setTimeout(() => {
        capturePhoto();
      }, 200);
    } else {
      console.log("⚠️ Capture already in progress, skipping...");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Ensure video is ready
      if (
        video.readyState === 4 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(video, 0, 0);

          canvas.toBlob(
            (blob: Blob | null) => {
              if (blob) {
                console.log(
                  "✅ Photo captured successfully! File size:",
                  blob.size,
                  "bytes"
                );
                const imageUrl = URL.createObjectURL(blob);
                setCapturedImage(imageUrl);
                capturedImageRef.current = imageUrl;
                setIsCapturing(false);
                setCountdown(null);
              } else {
                // Fallback: try again after a short delay
                setTimeout(() => {
                  capturePhoto();
                }, 500);
              }
            },
            "image/jpeg",
            0.95
          );
        }
      } else {
        // Wait for video to be ready then capture
        const waitForVideo = () => {
          if (video.readyState === 4 && video.videoWidth > 0) {
            capturePhoto();
          } else {
            setTimeout(waitForVideo, 100);
          }
        };
        waitForVideo();
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    handDetectionService.dispose();
    setCapturedImage(null);
    setIsCapturing(false);
    setCountdown(null);
    setIsSuccess(false);
    setIsHandDetected(false);
    setDetectionStatus("detecting");
    setHandPosition({ x: 50, y: 50 });
    setHandDetection(null);
    onClose();
  };

  const handleRetakePhoto = () => {
    // Reset semua state
    setCapturedImage(null);
    capturedImageRef.current = null;
    setIsCapturing(false);
    setCountdown(null);
    setIsSuccess(false);
    setDetectionStatus("detecting");
    setIsHandDetected(false);
    setHandDetection(null);
    setHandPosition({ x: 50, y: 50 });

    // Reset pose sequence dan mulai lagi
    handDetectionService.startPoseSequence();

    // Restart pose detection setelah short delay
    setTimeout(() => {
      startPoseDetection();
    }, 100);
  };

  const handleSubmitPhoto = () => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob(
        (blob: Blob | null) => {
          if (blob) {
            const imageFile = new File([blob], "profile-photo.jpg", {
              type: "image/jpeg",
            });
            onSuccess(imageFile);
            handleClose();
          }
        },
        "image/jpeg",
        0.95
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-start text-2xl font-bold -mb-2">
            Raise Your Hand to Capture{" "}
          </DialogTitle>
          <DialogDescription>
            We'll take the photo once your hand pose is detected. Follow the hand poses shown below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isSuccess ? (
            <>
              {/* Instructions */}
              <div className="text-start space-y-2">
                <p className="text-md font-medium text-gray-900">
                  We’ll take the photo once your hand pose is detected.
                </p>
              </div>

              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {capturedImage ? (
                  <>
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-full object-cover"
                    />
                    {/* Success overlay */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-green-500 text-white p-2 rounded-full">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    </div>
                  </>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Hand Detection Box Overlay - Only shows when hand is detected */}
                {!capturedImage && isHandDetected && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className={`absolute border-2 rounded-lg -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
                        detectionStatus === "detected"
                          ? "border-green-400 w-24 h-24"
                          : detectionStatus === "not-detected"
                          ? "border-red-400 w-32 h-32"
                          : "border-green-400 w-32 h-32"
                      }`}
                      style={{
                        left: `${handPosition.x}%`,
                        top: `${handPosition.y}%`,
                      }}
                    >
                      {/* Corner brackets for detection box */}
                      <div
                        className={`absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 ${
                          detectionStatus === "detected"
                            ? "border-green-400"
                            : detectionStatus === "not-detected"
                            ? "border-red-400"
                            : "border-green-400"
                        }`}
                      ></div>
                      <div
                        className={`absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 ${
                          detectionStatus === "detected"
                            ? "border-green-400"
                            : detectionStatus === "not-detected"
                            ? "border-red-400"
                            : "border-green-400"
                        }`}
                      ></div>
                      <div
                        className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 ${
                          detectionStatus === "detected"
                            ? "border-green-400"
                            : detectionStatus === "not-detected"
                            ? "border-red-400"
                            : "border-green-400"
                        }`}
                      ></div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 ${
                          detectionStatus === "detected"
                            ? "border-green-400"
                            : detectionStatus === "not-detected"
                            ? "border-red-400"
                            : "border-green-400"
                        }`}
                      ></div>
                    </div>

                    {/* Detection Label */}
                    <div
                      className="absolute -translate-x-1/2 -translate-y-full mb-2"
                      style={{
                        left: `${handPosition.x}%`,
                        top: `${handPosition.y - 8}%`,
                      }}
                    >
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium text-white ${
                          detectionStatus === "detected"
                            ? "bg-green-500"
                            : detectionStatus === "not-detected"
                            ? "bg-red-500"
                            : "bg-green-500"
                        }`}
                      >
                        {detectionStatus === "detected"
                          ? "✓ Pose Detected!"
                          : detectionStatus === "not-detected"
                          ? "✗ Wrong Pose"
                          : `Pose ${
                              handDetectionService.getPoseState().targetPose
                            }`}
                      </div>
                    </div>

                    {/* Step Label */}
                    <div
                      className="absolute -translate-x-1/2 translate-y-full mt-2"
                      style={{
                        left: `${handPosition.x}%`,
                        top: `${handPosition.y + 8}%`,
                      }}
                    ></div>

                    {/* Target lines extending from box */}
                    <div
                      className={`absolute w-px h-12 -translate-x-1/2 ${
                        detectionStatus === "detected"
                          ? "bg-green-400"
                          : detectionStatus === "not-detected"
                          ? "bg-red-400"
                          : "bg-yellow-400"
                      } opacity-50`}
                      style={{
                        left: `${handPosition.x}%`,
                        top: `${handPosition.y - 10}%`,
                      }}
                    />
                    <div
                      className={`absolute w-px h-12 -translate-x-1/2 ${
                        detectionStatus === "detected"
                          ? "bg-green-400"
                          : detectionStatus === "not-detected"
                          ? "bg-red-400"
                          : "bg-yellow-400"
                      } opacity-50`}
                      style={{
                        left: `${handPosition.x}%`,
                        top: `${handPosition.y + 10}%`,
                      }}
                    />
                    <div
                      className={`absolute h-px w-12 -translate-y-1/2 ${
                        detectionStatus === "detected"
                          ? "bg-green-400"
                          : detectionStatus === "not-detected"
                          ? "bg-red-400"
                          : "bg-yellow-400"
                      } opacity-50`}
                      style={{
                        left: `${handPosition.x - 10}%`,
                        top: `${handPosition.y}%`,
                      }}
                    />
                    <div
                      className={`absolute h-px w-12 -translate-y-1/2 ${
                        detectionStatus === "detected"
                          ? "bg-green-400"
                          : detectionStatus === "not-detected"
                          ? "bg-red-400"
                          : "bg-yellow-400"
                      } opacity-50`}
                      style={{
                        left: `${handPosition.x + 10}%`,
                        top: `${handPosition.y}%`,
                      }}
                    />
                  </div>
                )}

                {/* Hand Detection Status - Shows when no hand detected
                {!capturedImage && !isHandDetected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-black bg-opacity-70 px-6 py-4 rounded-lg">
                      <div className="animate-pulse mb-2">
                        <div className="w-12 h-12 mx-auto mb-2 border-2 border-yellow-400 rounded-lg flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                        </div>
                      </div>
                      <p className="text-yellow-400 text-sm font-medium">
                        Show your hand to start detection
                      </p>
                      <p className="text-yellow-300 text-xs mt-1">
                        Place your hand in front of the camera
                      </p>
                    </div>
                  </div>
                )} */}

                {/* Countdown Overlay - Keep video visible */}
                {countdown && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="text-center z-20">
                      <p className="text-white text-xl font-bold px-6 py-3 mb-4">
                        Capturing photo in
                      </p>
                      <div className="text-white text-8xl font-bold animate-pulse drop-shadow-2xl">
                        {countdown}
                      </div>
                    </div>
                  </div>
                )}

                {/* Detection Status Indicator
                {!capturedImage && !countdown && (
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                        detectionStatus === "detected"
                          ? "bg-green-500"
                          : detectionStatus === "not-detected"
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    >
                      {detectionStatus === "detected"
                        ? "✓ Pose Detected!"
                        : detectionStatus === "not-detected"
                        ? "✗ Wrong Pose"
                        : `Pose ${handDetectionService.getPoseState().targetPose}`}
                    </div>
                  </div>
                )} */}
              </div>

              {/* Instructions - Hidden when photo is captured */}
              {!capturedImage && (
                <div className="text-start ml-2">
                  <p className="text-xs font-medium text-gray-600">
                    To take a picture, follow the hand poses in the order shown
                    below. The system will automatically capture the image once
                    the final pose is detected.
                  </p>
                  <div className="flex flex-1 mx-15 mt-5 space-x-4">
                    {getPoseStatus().map((pose, index) => (
                      <React.Fragment key={pose.id}>
                        <div className="relative">
                          <div
                            className={`rounded-lg border-4 ${pose.borderColor} transition-colors duration-300`}
                          >
                            <Image
                              src={pose.src}
                              alt={`Pose ${pose.id}`}
                              className="rounded-lg object-cover"
                              width={100}
                              height={100}
                            />
                          </div>
                          {pose.status === "detecting" && (
                            <div className="absolute -top-2 -right-2">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                            </div>
                          )}
                          {pose.status === "completed" && (
                            <div className="absolute -top-2 -right-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-2 h-2 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                        {index < 2 && (
                          <ChevronRight className="w-10 h-10 mt-8 text-gray-700" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Hidden canvas for photo capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Action buttons when photo is captured */}
              {capturedImage && (
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={handleRetakePhoto}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retake Photo</span>
                  </button>
                  <button
                    onClick={handleSubmitPhoto}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
              <p className="text-lg font-medium text-gray-900">
                Face verification completed successfully!
              </p>
              <p className="text-gray-600">
                Your profile photo has been captured and verified.
              </p>
            </div>
          )}

          {/* Action Buttons */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
