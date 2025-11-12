import * as handpose from "@tensorflow-models/handpose";
import * as fp from "fingerpose";
import "@tensorflow/tfjs-backend-webgl";

export interface HandPoint {
  x: number;
  y: number;
  z?: number;
}

export interface HandDetection {
  handDetected: boolean;
  keypoints: HandPoint[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  currentPose: number; // 1, 2, or 3 based on detected gesture
  confidence: number;
  poseName: string;
  fingerCount: number; // Number of fingers detected (1, 2, or 3)
  isStable?: boolean; // Whether the pose is stable for capture
  stableTime?: number; // How long the pose has been stable (ms)
  shouldCapture?: boolean; // Whether to trigger capture
}

export interface PoseSequenceState {
  currentPoseStep: number; // 0: start, 1: pose 1, 2: pose 2, 3: pose 3, 4: countdown, 5: captured
  targetPose: number; // The pose we're currently trying to detect (1, 2, or 3)
  poseStableStartTime: number | null;
  isCountingDown: boolean;
  countdownStartTime: number | null;
  countdownValue: number; // 3, 2, 1, 0 (capture)
  captureTriggered: boolean;
}

export class HandDetectionService {
  private model: handpose.HandPose | null = null;
  private gestureEstimator: fp.GestureEstimator | null = null;
  private isInitialized = false;
  private captureCallback: (() => void) | null = null;

  // Pose sequence management
  private poseState: PoseSequenceState = {
    currentPoseStep: 0,
    targetPose: 1,
    poseStableStartTime: null,
    isCountingDown: false,
    countdownStartTime: null,
    countdownValue: 3,
    captureTriggered: false,
  };

  // Configuration
  private readonly POSE_STABILITY_TIME = 3000; // 3 seconds
  private readonly COUNTDOWN_DURATION = 1000; // 1 second per countdown number
  private readonly POSE_CONFIDENCE_THRESHOLD = 2.0; // Higher threshold for better accuracy

  // Create custom gesture for pose 1: One Finger (Index Finger Up) - More Forgiving
  private createOneFingerGesture(): fp.GestureDescription {
    const oneFinger = new fp.GestureDescription("one_finger");

    // Index finger extended - more forgiving
    oneFinger.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 0.9);
    oneFinger.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 0.3);

    // Multiple direction options for index finger
    oneFinger.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 0.8);
    oneFinger.addDirection(
      fp.Finger.Index,
      fp.FingerDirection.DiagonalUpLeft,
      0.6
    );
    oneFinger.addDirection(
      fp.Finger.Index,
      fp.FingerDirection.DiagonalUpRight,
      0.6
    );
    oneFinger.addDirection(
      fp.Finger.Index,
      fp.FingerDirection.HorizontalLeft,
      0.3
    );
    oneFinger.addDirection(
      fp.Finger.Index,
      fp.FingerDirection.HorizontalRight,
      0.3
    );

    // Other fingers should be firmly curled - more restrictive for better accuracy
    for (let finger of [fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
      oneFinger.addCurl(finger, fp.FingerCurl.FullCurl, 1.0); // Must be fully curled
      oneFinger.addCurl(finger, fp.FingerCurl.HalfCurl, 0.3); // Allow slight bend
      oneFinger.addCurl(finger, fp.FingerCurl.NoCurl, 0.0); // Don't allow uncurl
    }

    // Thumb must be curled or down - more restrictive
    oneFinger.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 0.8);
    oneFinger.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
    oneFinger.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.1);

    return oneFinger;
  }

  // Create custom gesture for pose 2: Two Fingers (Peace Sign) - based on VictoryGesture
  private createTwoFingerGesture(): fp.GestureDescription {
    const twoFinger = new fp.GestureDescription("two_fingers");

    // Index and middle fingers extended - exactly like VictoryGesture
    twoFinger.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
    twoFinger.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);

    // Add multiple direction options for better detection
    for (let finger of [fp.Finger.Index, fp.Finger.Middle]) {
      twoFinger.addDirection(finger, fp.FingerDirection.VerticalUp, 0.8);
      twoFinger.addDirection(finger, fp.FingerDirection.DiagonalUpLeft, 0.5);
      twoFinger.addDirection(finger, fp.FingerDirection.DiagonalUpRight, 0.5);
    }

    // Other fingers must be curled
    for (let finger of [fp.Finger.Ring, fp.Finger.Pinky]) {
      twoFinger.addCurl(finger, fp.FingerCurl.FullCurl, 0.8);
      twoFinger.addCurl(finger, fp.FingerCurl.HalfCurl, 0.8);
    }

    // Thumb can be in any position (less restrictive)
    twoFinger.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.5);
    twoFinger.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
    twoFinger.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 0.5);

    return twoFinger;
  }

  // Create custom gesture for pose 3: Three Fingers - Enhanced accuracy
  private createThreeFingerGesture(): fp.GestureDescription {
    const threeFinger = new fp.GestureDescription("three_fingers");

    // Index, middle, and ring fingers extended - higher precision like pose 1 & 2
    for (let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring]) {
      threeFinger.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
      // Higher direction scores for better accuracy like pose 1 & 2
      threeFinger.addDirection(finger, fp.FingerDirection.VerticalUp, 0.8);
      threeFinger.addDirection(finger, fp.FingerDirection.DiagonalUpLeft, 0.5);
      threeFinger.addDirection(finger, fp.FingerDirection.DiagonalUpRight, 0.5);
      threeFinger.addDirection(finger, fp.FingerDirection.HorizontalLeft, 0.3);
      threeFinger.addDirection(finger, fp.FingerDirection.HorizontalRight, 0.3);
    }

    // Pinky should be curled but more forgiving for pose 3
    threeFinger.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 0.8);
    threeFinger.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.8);
    threeFinger.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 0.2); // Allow slight extension

    // Thumb must be curled or down - more restrictive
    threeFinger.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 0.8);
    threeFinger.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
    threeFinger.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.1);

    return threeFinger;
  }

  async initialize(): Promise<void> {
    try {
      this.model = await handpose.load();

      const knownGestures = [
        // Only use our custom gestures for the specific flow
        this.createOneFingerGesture(), // Our custom index finger
        this.createTwoFingerGesture(), // Our custom peace sign
        this.createThreeFingerGesture(), // Our custom three fingers
        // Built-in gestures as fallbacks
        fp.Gestures.VictoryGesture, // 2 fingers (index + middle)
        fp.Gestures.ThumbsUpGesture, // For thumb detection
      ];

      this.gestureEstimator = new fp.GestureEstimator(knownGestures);
      this.isInitialized = true;
    } catch (error) {
      throw error;
    }
  }

  async detectHand(videoElement: HTMLVideoElement): Promise<HandDetection> {
    if (!this.model || !this.gestureEstimator || !this.isInitialized) {
      throw new Error("Hand detector not initialized");
    }

    try {
      // Get hand predictions
      const predictions = await this.model.estimateHands(videoElement);

      if (predictions.length === 0) {
        this.resetPoseStability();
        return {
          handDetected: false,
          keypoints: [],
          boundingBox: null,
          currentPose: 0,
          confidence: 0,
          poseName: "none",
          fingerCount: 0,
        };
      }

      const hand = predictions[0];
      const keypoints = hand.landmarks.map((point) => ({
        x: point[0],
        y: point[1],
        z: point[2],
      }));

      // Use lower threshold (more sensitive) and higher confidence threshold
      const gestureEstimate = this.gestureEstimator.estimate(
        hand.landmarks as any,
        9.0
      );

      let detectedPose = 0;
      let poseName = "none";
      let maxScore = 0;

      if (gestureEstimate.gestures.length > 0) {
        // Find gesture with highest match score
        const result = gestureEstimate.gestures.reduce((p: any, c: any) => {
          return p.score > c.score ? p : c;
        });

        // Optimized thresholds for each pose - more balanced for better detection
        let scoreThreshold = 3.0; // Default threshold
        if (result.name === "one_finger") {
          scoreThreshold = 1.8; // Lower threshold for single finger (most sensitive)
        } else if (result.name === "two_fingers") {
          scoreThreshold = 2.2; // Medium threshold for peace sign
        } else if (result.name === "three_fingers") {
          scoreThreshold = 2.0; // Reduced threshold for three fingers (was 2.5, now more sensitive)
        }
        if (result.score > scoreThreshold) {
          detectedPose = this.getPoseNumber(result.name);
          poseName = result.name;
          maxScore = result.score;
        } else {
        }
      } else {
      }

      // Fallback to simple finger counting if gesture recognition fails
      if (detectedPose === 0) {
        const simpleCount = this.simpleFingerCount(hand.landmarks);
        if (simpleCount > 0) {
          detectedPose = simpleCount;
          poseName = `simple_${simpleCount}_fingers`;
          maxScore = 6.0; // Medium confidence for simple detection
        }
      }

      // Special fallback: If we still haven't detected 1 finger, do specific index finger check
      if (detectedPose === 0) {
        const indexFingerCheck = this.detectIndexFingerExtended(hand.landmarks);
        if (indexFingerCheck) {
          detectedPose = 1;
          poseName = "index_finger_extended";
          maxScore = 5.0; // Good confidence for specific detection
        }
      }

      // Apply pose sequence logic
      const poseSequenceResult = this.updatePoseSequence(
        detectedPose,
        maxScore
      );

      // Calculate finger-aware bounding box after we know the pose
      let fingerAwareBoundingBox;
      try {
        fingerAwareBoundingBox = this.calculateFingerAwareBoundingBox(hand.landmarks, detectedPose);
        // Debug log to check if bounding box is calculated correctly
        if (!fingerAwareBoundingBox || typeof fingerAwareBoundingBox.x !== 'number') {
          fingerAwareBoundingBox = this.calculateBoundingBox(hand.landmarks);
        }
      } catch (error) {
        // Fallback to original bounding box calculation if there's an error
        fingerAwareBoundingBox = this.calculateBoundingBox(hand.landmarks);
      }

      const finalResult = {
        handDetected: true,
        keypoints,
        boundingBox: fingerAwareBoundingBox,
        currentPose: detectedPose,
        confidence: maxScore,
        poseName,
        fingerCount: detectedPose,
        isStable: poseSequenceResult.isStable,
        stableTime: poseSequenceResult.stableTime,
        shouldCapture: poseSequenceResult.shouldCapture,
      };

      return finalResult;
    } catch (error) {
      this.resetPoseStability();
      return {
        handDetected: false,
        keypoints: [],
        boundingBox: null,
        currentPose: 0,
        confidence: 0,
        poseName: "none",
        fingerCount: 0,
      };
    }
  }

  private getPoseNumber(gestureName: string): number {
    switch (gestureName) {
      case "one_finger":
        return 1;
      case "two_fingers":
        return 2;
      case "three_fingers":
        return 3;
      case "victory": // Built-in VictoryGesture (2 fingers - index + middle)
        return 2;
      default:
        return 0; // Will trigger simple detection fallback
    }
  }

  // Simple detection based on finger positions as fallback - More accurate
  private simpleFingerCount(landmarks: number[][]): number {
    try {
      // Special check for single index finger pose first
      const singleIndexCheck = this.detectSingleIndexFinger(landmarks);
      if (singleIndexCheck) {
        return 1;
      }

      // Special check for three fingers (index, middle, ring) pose
      const threeFingerCheck = this.detectThreeFingersPose(landmarks);
      if (threeFingerCheck) {
        return 3;
      }

      // Define finger tip and base indices for each finger
      const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips
      const fingerBases = [2, 5, 9, 13, 17]; // Thumb, Index, Middle, Ring, Pinky bases
      const fingerMCP = [1, 5, 9, 13, 17]; // MCP joints for more accurate detection

      let extendedCount = 0;
      const extendedFingers: number[] = [];

      for (let i = 0; i < fingerTips.length; i++) {
        const tip = landmarks[fingerTips[i]];
        const mcp = landmarks[fingerMCP[i]];
        const base = landmarks[fingerBases[i]];

        // Calculate if finger is extended (tip is further from palm than base)
        const palmBase = landmarks[0]; // Wrist
        const tipDistance = Math.sqrt(
          Math.pow(tip[0] - palmBase[0], 2) + Math.pow(tip[1] - palmBase[1], 2)
        );
        const mcpDistance = Math.sqrt(
          Math.pow(mcp[0] - palmBase[0], 2) + Math.pow(mcp[1] - palmBase[1], 2)
        );

        // More realistic threshold based on finger type - adjusted for better accuracy
        let threshold = 25; // Base threshold
        if (i === 0) threshold = 20; // Thumb is shorter
        if (i === 1) threshold = 40; // Increased threshold for index finger
        if (i === 2) threshold = 35; // Increased threshold for middle finger
        if (i === 3) threshold = 25; // Ring finger
        if (i === 4) threshold = 20; // Pinky is shorter

        // Additional check: finger should be pointing up/down more than extended horizontally
        const verticalExtension = tip[1] - base[1]; // Y-axis extension (negative = up)
        const isPointingUp = verticalExtension < -25; // Stricter upward requirement

        // More strict condition: finger must be extended AND pointing up for index/middle fingers
        let isExtended = tipDistance > mcpDistance + threshold;
        if (i === 1 || i === 2) {
          // Index and middle fingers
          isExtended = isExtended && isPointingUp;
        }

        // Additional strictness for middle finger when index is also extended (to avoid false 2-finger detection)
        if (i === 2 && extendedFingers.includes(1)) {
          // Middle finger when index is already detected
          // Require middle finger to be significantly more extended than index
          const indexTip = landmarks[8];
          const middleTip = landmarks[12];
          const middleIndexGap = Math.sqrt(
            Math.pow(middleTip[0] - indexTip[0], 2) +
              Math.pow(middleTip[1] - indexTip[1], 2)
          );
          const minimumGap = 30; // Minimum distance between index and middle tips
          isExtended = isExtended && middleIndexGap > minimumGap;
        }
      }

      // Post-processing: Special case for 1 finger detected with index finger
      if (extendedCount === 1 && extendedFingers.includes(1)) {
        // Verify this is truly a single finger pose by checking other fingers are definitely curled
        const otherFingersCurled = this.verifyOtherFingersCurled(landmarks, [
          1,
        ]); // Only index should be extended
        if (otherFingersCurled) {
          return 1;
        }
      }

      return Math.min(extendedCount, 3); // Cap at 3 for our use case
    } catch (error) {
      return 0;
    }
  }

  // Specialized detection for single index finger pose
  private detectSingleIndexFinger(landmarks: number[][]): boolean {
    try {
      const indexTip = landmarks[8];
      const indexMCP = landmarks[5];
      const middleTip = landmarks[12];
      const ringTip = landmarks[16];
      const pinkyTip = landmarks[20];
      const wrist = landmarks[0];

      // Check index finger is clearly extended and pointing up
      const indexExtension = Math.sqrt(
        Math.pow(indexTip[0] - wrist[0], 2) +
          Math.pow(indexTip[1] - wrist[1], 2)
      );

      // Check vertical alignment (index finger should be pointing upward)
      const verticalAlignment = indexMCP[1] - indexTip[1];
      const isPointingUp = verticalAlignment > 30;

      // Check other fingers are significantly closer to wrist (curled)
      const middleDistance = Math.sqrt(
        Math.pow(middleTip[0] - wrist[0], 2) +
          Math.pow(middleTip[1] - wrist[1], 2)
      );
      const ringDistance = Math.sqrt(
        Math.pow(ringTip[0] - wrist[0], 2) + Math.pow(ringTip[1] - wrist[1], 2)
      );
      const pinkyDistance = Math.sqrt(
        Math.pow(pinkyTip[0] - wrist[0], 2) +
          Math.pow(pinkyTip[1] - wrist[1], 2)
      );

      // Strict requirements for single index finger
      const minIndexExtension = 100; // Index must be well extended
      const maxOtherExtension = 70; // Other fingers must be relatively close
      const fingerSeparation = 40; // Minimum gap between index and other fingers

      const isIndexExtended = indexExtension > minIndexExtension;
      const areOthersCurled =
        middleDistance < maxOtherExtension &&
        ringDistance < maxOtherExtension &&
        pinkyDistance < maxOtherExtension;
      const hasGoodSeparation =
        indexExtension > middleDistance + fingerSeparation &&
        indexExtension > ringDistance + fingerSeparation &&
        indexExtension > pinkyDistance + fingerSeparation;

      return (
        isIndexExtended && areOthersCurled && hasGoodSeparation && isPointingUp
      );
    } catch (error) {
      return false;
    }
  }

  // Specialized detection for three fingers pose (index, middle, ring)
  private detectThreeFingersPose(landmarks: number[][]): boolean {
    try {
      const wrist = landmarks[0];
      const indexTip = landmarks[8];
      const indexMCP = landmarks[5];
      const middleTip = landmarks[12];
      const middleMCP = landmarks[9];
      const ringTip = landmarks[16];
      const ringMCP = landmarks[13];
      const pinkyTip = landmarks[20];
      
      // Calculate extensions for index, middle, and ring fingers
      const indexExtension = Math.sqrt(
        Math.pow(indexTip[0] - wrist[0], 2) + Math.pow(indexTip[1] - wrist[1], 2)
      );
      const middleExtension = Math.sqrt(
        Math.pow(middleTip[0] - wrist[0], 2) + Math.pow(middleTip[1] - wrist[1], 2)
      );
      const ringExtension = Math.sqrt(
        Math.pow(ringTip[0] - wrist[0], 2) + Math.pow(ringTip[1] - wrist[1], 2)
      );
      const pinkyExtension = Math.sqrt(
        Math.pow(pinkyTip[0] - wrist[0], 2) + Math.pow(pinkyTip[1] - wrist[1], 2)
      );

      // Check vertical alignment (fingers should be pointing upward)
      const indexVertical = indexMCP[1] - indexTip[1];
      const middleVertical = middleMCP[1] - middleTip[1];
      const ringVertical = ringMCP[1] - ringTip[1];
      const isPointingUp = indexVertical > 20 && middleVertical > 20 && ringVertical > 20; // Reduced from 25

      // More lenient requirements for three fingers pose
      const minExtensionThreshold = 80; // Reduced from 90 for easier detection
      const maxPinkyExtension = 80; // Increased from 60 (more forgiving for pinky)
      const fingerGap = 20; // Increased from 15 (more gap tolerance)

      // Check if index, middle, and ring are well extended
      const areThreeFingersExtended =
        indexExtension > minExtensionThreshold &&
        middleExtension > minExtensionThreshold &&
        ringExtension > minExtensionThreshold;

      // Check if pinky is properly curled (not extended)
      const isPinkyCurled = pinkyExtension < maxPinkyExtension;

      // Check for proper separation between the three fingers
      const hasProperSeparation =
        Math.abs(indexExtension - middleExtension) < fingerGap * 2 &&
        Math.abs(middleExtension - ringExtension) < fingerGap * 2;

      return areThreeFingersExtended && isPinkyCurled && hasProperSeparation && isPointingUp;
    } catch (error) {
      return false;
    }
  }

  // Verify that specified fingers are extended while others are curled
  private verifyOtherFingersCurled(
    landmarks: number[][],
    extendedFingerIndices: number[]
  ): boolean {
    try {
      const wrist = landmarks[0];
      const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
      const maxCurledDistance = 65; // Maximum distance for a finger to be considered curled

      for (let i = 0; i < fingerTips.length; i++) {
        if (!extendedFingerIndices.includes(i)) {
          // If this finger should be curled
          const tip = landmarks[fingerTips[i]];
          const distance = Math.sqrt(
            Math.pow(tip[0] - wrist[0], 2) + Math.pow(tip[1] - wrist[1], 2)
          );

          if (distance > maxCurledDistance) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Special detection for index finger extended
  private detectIndexFingerExtended(landmarks: number[][]): boolean {
    try {
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const ringTip = landmarks[16];
      const pinkyTip = landmarks[20];
      const wrist = landmarks[0];

      // Check if index finger is extended (should be far from wrist)
      const indexDistance = Math.sqrt(
        Math.pow(indexTip[0] - wrist[0], 2) +
          Math.pow(indexTip[1] - wrist[1], 2)
      );

      // Check if other fingers are closer (curled)
      const middleDistance = Math.sqrt(
        Math.pow(middleTip[0] - wrist[0], 2) +
          Math.pow(middleTip[1] - wrist[1], 2)
      );

      const ringDistance = Math.sqrt(
        Math.pow(ringTip[0] - wrist[0], 2) + Math.pow(ringTip[1] - wrist[1], 2)
      );

      const pinkyDistance = Math.sqrt(
        Math.pow(pinkyTip[0] - wrist[0], 2) +
          Math.pow(pinkyTip[1] - wrist[1], 2)
      );

      // More strict index finger detection
      const fingerGap = 35; // Increased gap for better separation
      const indexExtensionThreshold = 90; // Increased threshold for clearer detection

      // Additional check: index finger should be pointing upward
      const indexMCP = landmarks[5]; // Index finger MCP joint
      const verticalExtension = indexMCP[1] - indexTip[1]; // Positive when pointing up
      const isPointingUp = verticalExtension > 25; // Index finger must point upward

      const isIndexExtended = indexDistance > indexExtensionThreshold;
      const areOthersCurled =
        indexDistance > middleDistance + fingerGap &&
        indexDistance > ringDistance + fingerGap &&
        indexDistance > pinkyDistance + fingerGap;

      const result = isIndexExtended && areOthersCurled && isPointingUp;

      return result;
    } catch (error) {
      return false;
    }
  }

  private calculateBoundingBox(landmarks: number[][]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (landmarks.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const xs = landmarks.map((point) => point[0]);
    const ys = landmarks.map((point) => point[1]);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Add some padding
    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width,
      height,
    };
  }

  // Calculate finger-aware bounding box for better positioning
  private calculateFingerAwareBoundingBox(landmarks: number[][], detectedPose: number): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (landmarks.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let relevantLandmarks: number[][];

    // For different poses, focus on different landmarks
    if (detectedPose >= 1 && detectedPose <= 3) {
      // For hand poses, focus on fingertips and finger joints instead of full hand
      const fingerIndices = [
        0,   // wrist (include for stability)
      ];

      // Add specific fingers based on pose
      if (detectedPose === 1) {
        // Pose 1: Focus on index finger + validation for other fingers
        fingerIndices.push(5, 6, 7, 8);   // index finger (main target)
        fingerIndices.push(17, 18, 19, 20); // pinky (must be curled)
      } else if (detectedPose === 2) {
        // Pose 2: Focus on index + middle fingers + validation for others
        fingerIndices.push(5, 6, 7, 8);   // index finger
        fingerIndices.push(9, 10, 11, 12); // middle finger
        fingerIndices.push(17, 18, 19, 20); // pinky (must be curled)
      } else if (detectedPose === 3) {
        // Pose 3: Focus on index + middle + ring fingers (the 3 extended fingers)
        fingerIndices.push(5, 6, 7, 8);   // index finger
        fingerIndices.push(9, 10, 11, 12); // middle finger
        fingerIndices.push(13, 14, 15, 16); // ring finger
        // Note: pinky should be curled, so we don't include it for pose 3
      }

      // Include thumb for stability (all poses)
      fingerIndices.push(1, 2, 3, 4); // thumb

      // Safely map landmarks, filtering out undefined/null values
      relevantLandmarks = fingerIndices
        .map(i => landmarks[i])
        .filter(point => point && point.length >= 2); // Ensure we have valid x,y coordinates
    } else {
      // Default: use all landmarks for other cases
      relevantLandmarks = landmarks;
    }

    // Fallback to original landmarks if we filtered out too many
    if (relevantLandmarks.length === 0) {
      relevantLandmarks = landmarks;
    }

    const xs = relevantLandmarks.map((point) => point[0]);
    const ys = relevantLandmarks.map((point) => point[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Dynamic padding based on pose
    let padding = 20;
    if (detectedPose === 3) {
      padding = 30; // More padding for 3 fingers to ensure full coverage
    }

    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width,
      height,
    };
  }

  dispose(): void {
    // handpose models don't have a dispose method, just clear references
    this.model = null;
    this.gestureEstimator = null;
    this.isInitialized = false;
  }

  // Pose sequence management methods
  private updatePoseSequence(
    detectedPose: number,
    confidence: number
  ): {
    isStable: boolean;
    stableTime: number;
    shouldCapture: boolean;
  } {
    const currentTime = Date.now();
    const isCorrectPose =
      detectedPose === this.poseState.targetPose &&
      confidence >= this.POSE_CONFIDENCE_THRESHOLD;

    // If detected pose matches target, start or continue stability timer
    if (isCorrectPose) {
      if (this.poseState.poseStableStartTime === null) {
        this.poseState.poseStableStartTime = currentTime;
      }

      const stableTime = currentTime - this.poseState.poseStableStartTime;
      const isStable = stableTime >= this.POSE_STABILITY_TIME;

      if (isStable && !this.poseState.captureTriggered) {
        // Move to next pose step
        this.moveToNextPose();

        // Only return shouldCapture: true if this is the final pose (3) and countdown will be triggered
        const shouldCapture = this.poseState.currentPoseStep === 3; // After moving to step 4 (countdown)
        return { isStable: true, stableTime, shouldCapture };
      }

      return { isStable: false, stableTime, shouldCapture: false };
    } else {
      // Reset stability if wrong pose
      this.resetPoseStability();
      return { isStable: false, stableTime: 0, shouldCapture: false };
    }
  }

  private moveToNextPose(): void {
    this.poseState.captureTriggered = true;
    this.poseState.poseStableStartTime = null;

    // Move to next pose step
    if (this.poseState.currentPoseStep < 3) {
      this.poseState.currentPoseStep++;
      this.poseState.targetPose = this.poseState.currentPoseStep;
      this.poseState.captureTriggered = false;
    } else if (this.poseState.currentPoseStep === 3) {
      // All poses completed, start countdown
      this.poseState.currentPoseStep = 4; // countdown step
      this.poseState.isCountingDown = true;
      this.poseState.countdownStartTime = Date.now();
      this.poseState.countdownValue = 3;
      this.poseState.captureTriggered = false; // Reset for countdown
    }
  }

  private resetPoseStability(): void {
    this.poseState.poseStableStartTime = null;
  }

  // Public methods for UI integration
  public startPoseSequence(): void {
    this.poseState = {
      currentPoseStep: 1,
      targetPose: 1,
      poseStableStartTime: null,
      isCountingDown: false,
      countdownStartTime: null,
      countdownValue: 3,
      captureTriggered: false,
    };
  }

  public resetPoseSequence(): void {
    this.poseState = {
      currentPoseStep: 0,
      targetPose: 1,
      poseStableStartTime: null,
      isCountingDown: false,
      countdownStartTime: null,
      countdownValue: 3,
      captureTriggered: false,
    };
  }

  public getPoseState(): PoseSequenceState {
    return { ...this.poseState };
  }

  public getCountdownState(): {
    isCountingDown: boolean;
    countdownValue: number;
    shouldCapture: boolean;
  } {
    if (
      !this.poseState.isCountingDown ||
      this.poseState.countdownStartTime === null
    ) {
      return { isCountingDown: false, countdownValue: 3, shouldCapture: false };
    }

    const currentTime = Date.now();
    const elapsed = currentTime - this.poseState.countdownStartTime;

    // More precise countdown calculation using time ranges instead of Math.floor
    let currentCountdown;
    if (elapsed < 1000) {
      currentCountdown = 3;
    } else if (elapsed < 2000) {
      currentCountdown = 2;
    } else if (elapsed < 3000) {
      currentCountdown = 1;
    } else {
      currentCountdown = 0;
      // Debug when countdown reaches 0
    }

    // 🔥 CRITICAL FIX: Calculate shouldCapture based on PRE-MODIFICATION state
    const shouldCapture =
      currentCountdown === 0 && !this.poseState.captureTriggered;

    // Only debug when countdown reaches 0 to reduce log spam
    if (currentCountdown === 0) {
    }

    if (shouldCapture) {

      // ✅ CAPTURE SUCCESSFUL - Modify state AFTER calculating shouldCapture
      this.poseState.captureTriggered = true;
      this.poseState.currentPoseStep = 5; // captured
      this.poseState.isCountingDown = false; // Stop countdown after capture
      this.poseState.countdownStartTime = null; // Reset countdown start time


      // 🔥 DIRECT TRIGGER: Call capture callback immediately
      if (this.captureCallback) {
        this.captureCallback();
      } else {
      }
    }

    // ✅ Return the MODIFIED state along with the calculated shouldCapture
    const returnState = {
      isCountingDown: this.poseState.isCountingDown, // This will be false after capture
      countdownValue: currentCountdown,
      shouldCapture: shouldCapture, // This preserves the true value when countdown hits 0
    };

    return returnState;
  }

  public getCurrentPoseInstruction(): string {
    switch (this.poseState.currentPoseStep) {
      case 0:
        return "Lift your hand to start";
      case 1:
        return "Show 1 finger (index finger up) - hold for 3 seconds";
      case 2:
        return "Show 2 fingers (peace sign) - hold for 3 seconds";
      case 3:
        return "Show 3 fingers - hold for 3 seconds";
      case 4:
        const countdownState = this.getCountdownState();
        if (countdownState.isCountingDown) {
          return `Get ready! ${countdownState.countdownValue}...`;
        }
        return "Get ready for photo!";
      case 5:
        return "Photo captured!";
      default:
        return "Unknown step";
    }
  }

  // Set capture callback for direct triggering
  public setCaptureCallback(callback: () => void): void {
    this.captureCallback = callback;
  }

  // Clear capture callback
  public clearCaptureCallback(): void {
    this.captureCallback = null;
  }

  isReady(): boolean {
    return (
      this.isInitialized &&
      this.model !== null &&
      this.gestureEstimator !== null
    );
  }
}

export const handDetectionService = new HandDetectionService();
