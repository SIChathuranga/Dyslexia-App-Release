import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { sendFrameToAPI } from '../services/modelService';
import { Colors } from '../../../theme/colors';
import { fonts } from '../../../theme';
import { saveModelPredictionAsAssessment } from '../utils/assessmentHelper';

const InstructionAssessmentScreen = ({ navigation }) => {
  const [tasks] = useState([
    {
      instruction: 'Touch your nose',
      description:  'Bring your hand to touch the tip of your nose',
      icon:         'face',
      color:        '#E0A6AA', // soft coral from palette
    },
    {
      instruction: 'Touch your head',
      description:  'Put your hand on top of your head',
      icon:         'person-outline',
      color:        '#96ADFC', // primary blue
    },
    {
      instruction: 'Wave your hand',
      description:  'Raise your hand and wave it side to side',
      icon:         'pan-tool',
      color:        '#A8F29A', // success green
    },
  ]);

  const [currentTask, setCurrentTask] = useState(0);
  const currentTaskRef = useRef(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [taskResults, setTaskResults] = useState(Array(3).fill(false));
  const [isValidating, setIsValidating] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState('waiting');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Always-mounted video ref for frame capture
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const visibleVideoRef = useRef(null);

  // ── Camera lifecycle ─────────────────────────────────────────────────────────
  useEffect(() => {
    const startCamera = async () => {
      if (isValidating && !streamRef.current) {
        try {
          setIsCameraReady(false);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          if (visibleVideoRef.current) {
            visibleVideoRef.current.srcObject = stream;
            await visibleVideoRef.current.play();
          }
          setIsCameraReady(true);
        } catch (error) {
          console.error('Failed to access camera:', error);
          Alert.alert(
            'Camera Error',
            'Could not access camera. Please check permissions.'
          );
          setIsValidating(false);
          setIsCameraReady(false);
        }
      }
    };

    const stopCamera = () => {
      if (!isValidating && streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        if (visibleVideoRef.current) visibleVideoRef.current.srcObject = null;
        setIsCameraReady(false);
      }
    };

    if (isValidating) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isValidating]);

  // ── Move to next task ────────────────────────────────────────────────────────
  const moveToNextTask = () => {
    const idx = currentTaskRef.current;
    if (idx < tasks.length - 1) {
      currentTaskRef.current = idx + 1;
      setCurrentTask(idx + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const validateWithCamera = () => {
    setIsValidating(true);
    setDetectionStatus('waiting');
  };

  // ── AI validation trigger ────────────────────────────────────────────────────
  useEffect(() => {
    const performValidation = async () => {
      if (isCameraReady && detectionStatus === 'waiting' && isValidating) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!isValidating) return;

        setDetectionStatus('detecting');

        try {
          const data = await sendFrameToAPI(
            tasks[currentTaskRef.current].instruction,
            videoRef.current
          );

          if (!data) {
            setDetectionStatus('waiting');
            return;
          }

          const success     = data.prediction === 1;
          const probability = ((data.probability || 0) * 100).toFixed(1);
          const features    = data.features || {};
          const hasFeatures = Object.keys(features).length > 0;

          setDetectionStatus(success ? 'success' : 'failed');

          setTimeout(() => {
            setModalData({ type: success ? 'success' : 'failure', probability, features, hasFeatures });
            setModalVisible(true);
            if (success) {
              const curidx = currentTaskRef.current;
              setTaskResults((prev) => {
                const next = [...prev];
                next[curidx] = true;
                return next;
              });
              setScore((prev) => prev + 100);
            }
          }, 1500);
        } catch (error) {
          console.error('Error during validation:', error);
          setDetectionStatus('waiting');
          setModalData({ type: 'error' });
          setModalVisible(true);
        }
      }
    };

    if (isCameraReady && detectionStatus === 'waiting') {
      performValidation();
    }
  }, [isCameraReady]);

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalData?.type === 'success' || modalData?.type === 'failure') {
      moveToNextTask();
    }
    setIsValidating(false);
    setModalData(null);
  };

  // ── Save assessment ──────────────────────────────────────────────────────────
  const saveAssessment = async (correctCount, percentage) => {
    try {
      setIsSaving(true);
      const modelPrediction = {
        prediction:  correctCount === tasks.length ? 1 : 0,
        probability: percentage / 100,
        features: {
          reaction_time:           0,
          sequence_accuracy:       correctCount / tasks.length,
          avg_joint_angle_error:   0,
          movement_smoothness:     1.0,
          instruction_delay:       0,
          error_repetition_count:  tasks.length - correctCount,
        },
      };
      await saveModelPredictionAsAssessment(
        modelPrediction,
        'INSTRUCTION_ASSESSMENT',
        `Completed ${correctCount}/${tasks.length} instructions. Score: ${score}/${tasks.length * 100}`
      );
      Alert.alert('Saved! 🎉', 'Your assessment has been saved!');
    } catch (error) {
      console.error('[InstructionAssessment] Error saving:', error);
      Alert.alert('Error', 'Failed to save assessment: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isCompleted && !isSaving) {
      const correctCount = taskResults.filter(Boolean).length;
      const percentage   = ((correctCount / tasks.length) * 100).toFixed(0);
      saveAssessment(correctCount, percentage);
    }
  }, [isCompleted]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getTip = (features, isSuccess) => {
    if (!features || Object.keys(features).length === 0) {
      return isSuccess
        ? 'Well done! Keep it up! 👍'
        : 'Make sure your full body is visible to the camera. 💡';
    }
    if (isSuccess) {
      if (features.avg_joint_angle_error !== undefined && features.avg_joint_angle_error < 30)
        return 'Great precision on your joint angles! 🌟';
      if (features.movement_smoothness !== undefined && features.movement_smoothness < 2)
        return 'Very smooth movement! 🌟';
      return 'Well done! Keep it up! 👍';
    }
    if (features.avg_joint_angle_error !== undefined && features.avg_joint_angle_error > 50)
      return 'Try to position your arm/hand more precisely. 💡';
    if (features.movement_smoothness !== undefined && features.movement_smoothness > 4)
      return 'Try to move more smoothly and steadily. 💡';
    if (features.error_repetition_count !== undefined && features.error_repetition_count > 1)
      return 'Focus on performing the action just once, clearly. 💡';
    if (features.instruction_delay !== undefined && features.instruction_delay > 0.1)
      return 'Try to react faster when you see the instruction. 💡';
    return 'Make sure your full body is visible to the camera. 💡';
  };

  const getPerformanceMessage = (pct) => {
    if (pct === 100) return 'Perfect! You followed all instructions correctly! 🌟';
    if (pct >= 75)   return 'Excellent work! You followed most instructions! 🎉';
    if (pct >= 50)   return 'Good effort! Keep practising! 💪';
    if (pct >= 25)   return "You're learning! Keep trying! 🦉";
    return "Keep practising! You'll improve! 🚀";
  };

  // ── Sub-components ───────────────────────────────────────────────────────────
  const FeatureRow = ({ icon, label, value, note }) => (
    <View style={styles.featureRow}>
      <Icon name={icon} size={18} color={Colors.mediumGray} style={{ marginRight: 8 }} />
      <Text style={styles.featureLabel}>{label}</Text>
      <View style={styles.featureValueWrap}>
        <Text style={styles.featureValue}>{value}</Text>
        {note && <Text style={styles.featureNote}> ({note})</Text>}
      </View>
    </View>
  );

  const ResultModal = () => {
    if (!modalData) return null;
    const isSuccess = modalData.type === 'success';
    const isError   = modalData.type === 'error';
    const { probability, features, hasFeatures } = modalData;

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalHeader,
                { backgroundColor: isError ? '#FF9800' : isSuccess ? Colors.successGreen : '#FF5252' },
              ]}
            >
              <Text style={styles.modalTitle}>
                {isError ? 'Validation Error' : isSuccess ? 'Action Detected! ✅' : 'Action Not Detected ❌'}
              </Text>
              <TouchableOpacity
                onPress={handleModalClose}
                style={styles.modalCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {isError ? (
                <Text style={styles.modalErrorText}>
                  Failed to process the image. Please try again.
                </Text>
              ) : (
                <>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.featureLabel}>Confidence</Text>
                    <View style={styles.confidenceBarBg}>
                      <View
                        style={[
                          styles.confidenceBarFill,
                          {
                            width: `${probability}%`,
                            backgroundColor: isSuccess ? Colors.successGreen : '#FF5252',
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.confidenceValue,
                        { color: isSuccess ? Colors.successGreen : '#FF5252' },
                      ]}
                    >
                      {probability}%
                    </Text>
                  </View>

                  {hasFeatures && (
                    <>
                      <View style={styles.divider} />
                      {features.reaction_time !== undefined && (
                        <FeatureRow
                          icon="bolt"
                          label="Reaction Time"
                          value={`${(features.reaction_time * 1000).toFixed(0)}ms`}
                        />
                      )}
                      {features.avg_joint_angle_error !== undefined && (
                        <FeatureRow
                          icon="straighten"
                          label="Joint Angle Error"
                          value={`${features.avg_joint_angle_error.toFixed(1)}°`}
                          note="lower is better"
                        />
                      )}
                      {features.movement_smoothness !== undefined && (
                        <FeatureRow
                          icon="auto-graph"
                          label="Movement Smoothness"
                          value={features.movement_smoothness.toFixed(2)}
                          note="lower is better"
                        />
                      )}
                      {features.instruction_delay !== undefined && (
                        <FeatureRow
                          icon="timer"
                          label="Instruction Delay"
                          value={`${(features.instruction_delay * 1000).toFixed(0)}ms`}
                        />
                      )}
                      {features.error_repetition_count !== undefined && (
                        <FeatureRow
                          icon="replay"
                          label="Error Count"
                          value={features.error_repetition_count}
                        />
                      )}
                      {features.sequence_accuracy !== undefined &&
                        features.sequence_accuracy !== -1 && (
                          <FeatureRow
                            icon="track-changes"
                            label="Accuracy"
                            value={`${features.sequence_accuracy}%`}
                          />
                        )}
                      <View style={styles.divider} />
                    </>
                  )}

                  <View
                    style={[
                      styles.tipBox,
                      { backgroundColor: isSuccess ? `${Colors.successGreen}20` : '#FF525220' },
                    ]}
                  >
                    <Text style={[styles.tipText, { color: isSuccess ? Colors.successGreen : '#FF5252' }]}>
                      {getTip(features, isSuccess)}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: isError ? '#FF9800' : isSuccess ? Colors.successGreen : '#FF5252' },
              ]}
              onPress={handleModalClose}
            >
              <Text style={styles.modalButtonText}>
                {isError ? 'OK' : 'Next Task ➡'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const task = tasks[currentTask];

  // ── Completion Screen ────────────────────────────────────────────────────────
  if (isCompleted) {
    const correctCount = taskResults.filter(Boolean).length;
    const percentage   = ((correctCount / tasks.length) * 100).toFixed(0);

    return (
      <ScrollView style={styles.container}>
        <ResultModal />
        <View style={styles.completionScreen}>
          <Icon
            name={correctCount === tasks.length ? 'check-circle' : 'info'}
            size={100}
            color={correctCount === tasks.length ? Colors.successGreen : Colors.accentYellow}
          />
          <Text style={styles.completionTitle}>Assessment Complete! 🎉</Text>
          <Text style={styles.completionText}>
            You correctly performed {correctCount} out of {tasks.length} instructions
          </Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreValue}>Final Score: {score}/{tasks.length * 100}</Text>
            <Text style={styles.performanceText}>Performance: {percentage}%</Text>
            <Text style={styles.performanceMessage}>
              {getPerformanceMessage(parseInt(percentage))}
            </Text>
          </View>

          {isSaving && (
            <View style={{ paddingVertical: 12 }}>
              <Text style={styles.savingText}>Saving your results…</Text>
            </View>
          )}

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Summary:</Text>
            {tasks.map((t, index) => (
              <View key={index} style={styles.summaryItem}>
                <Icon
                  name={taskResults[index] ? 'check-circle' : 'cancel'}
                  size={20}
                  color={taskResults[index] ? Colors.successGreen : Colors.errorCoral}
                />
                <Text style={styles.summaryText}>{t.instruction}</Text>
              </View>
            ))}
          </View>

          <View style={styles.completionButtons}>
            <TouchableOpacity
              style={[styles.completionButton, styles.backButton]}
              onPress={() => navigation.goBack()}
              disabled={isSaving}
            >
              <Text style={styles.backButtonText}>
                {isSaving ? 'Saving…' : 'Back'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.completionButton, styles.tryAgainButton]}
              onPress={() => {
                currentTaskRef.current = 0;
                setCurrentTask(0);
                setScore(0);
                setIsCompleted(false);
                setTaskResults(Array(tasks.length).fill(false));
              }}
              disabled={isSaving}
            >
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ResultModal />

      {/* Always-mounted hidden video for frame capture */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'fixed',
          opacity: 0,
          pointerEvents: 'none',
          width: 1,
          height: 1,
          top: 0,
          left: 0,
        }}
      />

      {/* ── Camera Validation Screen ── */}
      {isValidating && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                setIsValidating(false);
                setDetectionStatus('waiting');
              }}
            >
              <Icon name="arrow-back" size={24} color={Colors.darkGray} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Camera Validation</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.cameraContentContainer}>
            <View style={styles.cameraViewSection}>
              {/* Camera frame */}
              <View style={[styles.cameraFrame, { borderColor: task.color }]}>
                {!isCameraReady && (
                  <View style={styles.cameraLoadingOverlay}>
                    <Text style={styles.cameraLoadingText}>Starting camera…</Text>
                  </View>
                )}
                <video
                  ref={visibleVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 13,
                    transform: 'scaleX(-1)',
                    display: isCameraReady ? 'block' : 'none',
                  }}
                />
                {/* Overlay badge */}
                <View style={styles.cameraOverlay}>
                  {detectionStatus === 'detecting' && (
                    <View style={[styles.statusBadge, { backgroundColor: `${task.color}DD` }]}>
                      <Text style={styles.statusBadgeText}>🔍 Scanning…</Text>
                    </View>
                  )}
                  {detectionStatus === 'success' && (
                    <View style={[styles.statusBadge, { backgroundColor: '#4CAF50DD' }]}>
                      <Text style={styles.statusBadgeText}>✅ Action Detected!</Text>
                    </View>
                  )}
                  {detectionStatus === 'failed' && (
                    <View style={[styles.statusBadge, { backgroundColor: '#FF5252DD' }]}>
                      <Text style={styles.statusBadgeText}>❌ Not Detected</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Status row */}
              <View
                style={[
                  styles.detectionIndicatorBox,
                  { backgroundColor: `${task.color}15` },
                ]}
              >
                {detectionStatus === 'detecting' && (
                  <>
                    <View style={[styles.loadingDot, { backgroundColor: task.color }]} />
                    <Text style={[styles.detectionStatusText, { color: task.color }]}>
                      Analysing your movement…
                    </Text>
                  </>
                )}
                {detectionStatus === 'success' && (
                  <>
                    <Icon name="check-circle" size={24} color={Colors.successGreen} />
                    <Text style={[styles.detectionStatusText, { color: Colors.successGreen }]}>
                      Action Detected Successfully!
                    </Text>
                  </>
                )}
                {detectionStatus === 'failed' && (
                  <>
                    <Icon name="cancel" size={24} color="#FF5252" />
                    <Text style={[styles.detectionStatusText, { color: '#FF5252' }]}>
                      Action Not Detected — Try Again
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Task info */}
            <View style={styles.cameraTaskSection}>
              <Text style={styles.cameraTaskNumberText}>
                Task {currentTask + 1} of {tasks.length}
              </Text>
              <View
                style={[
                  styles.cameraTaskCard,
                  { borderColor: task.color, borderLeftWidth: 4 },
                ]}
              >
                <Icon name={task.icon} size={30} color={task.color} />
                <View style={styles.taskInfoContainer}>
                  <Text style={[styles.cameraTaskTitle, { color: task.color }]}>
                    {task.instruction}
                  </Text>
                  <Text style={styles.cameraTaskDescription}>{task.description}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.cameraInstructionBox,
                  { backgroundColor: `${task.color}10` },
                ]}
              >
                <Icon name="info" size={20} color={task.color} />
                <Text style={[styles.cameraInstructionText, { color: Colors.textDark }]}>
                  Position yourself in front of the camera and perform the action clearly.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── Main Task Screen ── */}
      {!isValidating && (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={Colors.darkGray} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Follow Instructions</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((currentTask + 1) / tasks.length) * 100}%`,
                      backgroundColor: task.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                Task {currentTask + 1} of {tasks.length}
              </Text>
              <Text style={styles.scoreText}>Score: {score}/{tasks.length * 100}</Text>
            </View>

            {/* Task card */}
            <View style={styles.taskContainer}>
              <Icon name={task.icon} size={100} color={task.color} />
              <Text style={styles.instructionLabel}>Instruction:</Text>
              <View style={[styles.instructionCard, { borderColor: task.color }]}>
                <Text style={[styles.instructionText, { color: task.color }]}>
                  {task.instruction}
                </Text>
                <Text style={[styles.descriptionText, { color: task.color }]}>
                  {task.description}
                </Text>
              </View>
              <Text style={styles.readyText}>Ready to show us? 🎯</Text>
              <TouchableOpacity
                style={[styles.cameraButton, { backgroundColor: task.color }]}
                onPress={validateWithCamera}
              >
                <Icon name="videocam" size={24} color="white" />
                <Text style={styles.cameraButtonText}>Open Camera</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundWhite },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: Colors.textDark,
  },
  content: { flex: 1, padding: 20 },

  // Progress
  progressContainer: { marginBottom: 40 },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: Colors.primaryBlue,
  },

  // Task card
  taskContainer: { alignItems: 'center' },
  instructionLabel: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: Colors.mediumGray,
    marginTop: 24,
    marginBottom: 12,
  },
  instructionCard: {
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 26,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  readyText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    marginBottom: 24,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.bold,
    marginLeft: 12,
  },

  // Camera validation layout
  cameraContentContainer: { flexGrow: 1, padding: 20 },
  cameraViewSection: { marginBottom: 20 },
  cameraFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#000',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraLoadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  cameraLoadingText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  statusBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
  },
  statusBadgeText: {
    color: 'white',
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  detectionIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  loadingDot: { width: 12, height: 12, borderRadius: 6, opacity: 0.8 },
  detectionStatusText: { fontSize: 13, fontFamily: fonts.bold },
  cameraTaskSection: { marginTop: 12 },
  cameraTaskNumberText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  cameraTaskCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    gap: 12,
  },
  taskInfoContainer: { flex: 1 },
  cameraTaskTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  cameraTaskDescription: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
  },
  cameraInstructionBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  cameraInstructionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  modalCloseButton: {
    marginLeft: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: 'white',
    flex: 1,
  },
  modalBody: {
    padding: 20,
    maxHeight: 380,
    backgroundColor: Colors.white,
  },
  modalErrorText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: Colors.textDark,
    textAlign: 'center',
    paddingVertical: 20,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  confidenceBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#EEE',
    borderRadius: 5,
    overflow: 'hidden',
  },
  confidenceBarFill: { height: '100%', borderRadius: 5 },
  confidenceValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
    minWidth: 48,
    textAlign: 'right',
  },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  featureLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    flex: 1,
  },
  featureValueWrap: { flexDirection: 'row', alignItems: 'center' },
  featureValue: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: Colors.textDark,
  },
  featureNote: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
  },
  tipBox: { padding: 14, borderRadius: 10, marginTop: 4 },
  tipText: { fontSize: 13, fontFamily: fonts.bold, lineHeight: 20 },
  modalButton: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 15,
    fontFamily: fonts.bold,
  },

  // Completion
  completionScreen: { padding: 20, alignItems: 'center' },
  completionTitle: {
    fontSize: 26,
    fontFamily: fonts.bold,
    marginTop: 24,
    marginBottom: 16,
    color: Colors.textDark,
  },
  completionText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreCard: {
    width: '100%',
    padding: 24,
    backgroundColor: `${Colors.primaryBlue}20`,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: Colors.primaryBlue,
    marginBottom: 12,
  },
  performanceText: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: Colors.primaryBlue,
    marginBottom: 12,
  },
  performanceMessage: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    textAlign: 'center',
  },
  savingText: {
    fontFamily: fonts.bold,
    color: Colors.primaryBlue,
    fontSize: 14,
    textAlign: 'center',
  },
  summaryContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: Colors.textDark,
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: Colors.textDark,
    marginLeft: 8,
  },
  completionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  completionButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButton: { backgroundColor: Colors.lightGray },
  backButtonText: {
    fontFamily: fonts.bold,
    color: Colors.textDark,
    fontSize: 14,
  },
  tryAgainButton: { backgroundColor: Colors.primaryBlue },
  tryAgainButtonText: {
    fontFamily: fonts.bold,
    color: 'white',
    fontSize: 14,
  },
});

export default InstructionAssessmentScreen;
