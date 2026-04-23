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

const MemoryAssessmentScreen = ({ navigation }) => {
  const [commands] = useState([
    'Touch your nose',
    'Wave your hand',
    'Touch your head',
    'Stand up',
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(Array(4).fill(false));
  const [isMemoryPhaseComplete, setIsMemoryPhaseComplete] = useState(false);
  const [isValidationPhaseComplete, setIsValidationPhaseComplete] = useState(false);
  const [validationScore, setValidationScore] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [currentValidationStep, setCurrentValidationStep] = useState(0);
  const [validationResults, setValidationResults] = useState([]);
  const [detectionStatus, setDetectionStatus] = useState('waiting'); // waiting | detecting | success | failed
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

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
          Alert.alert('Camera Error', 'Could not access camera. Please check permissions.');
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

  // ── AI validation ────────────────────────────────────────────────────────────
  useEffect(() => {
    const performValidation = async () => {
      if (isCameraReady && detectionStatus === 'waiting' && isValidating) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!isValidating) return;

        setDetectionStatus('detecting');

        try {
          const data = await sendFrameToAPI(
            commands[currentValidationStep],
            videoRef.current
          );

          if (!data) {
            setDetectionStatus('waiting');
            return;
          }

          const success =
            data.prediction === 1 ||
            data.instruction_check?.target_met === true;
          const probability = ((data.probability || 0) * 100).toFixed(1);
          const features    = data.features || {};
          const hasFeatures = Object.keys(features).length > 0;

          setDetectionStatus(success ? 'success' : 'failed');

          setTimeout(() => {
            setModalData({
              type: success ? 'success' : 'failure',
              success,
              probability,
              features,
              hasFeatures,
              command: commands[currentValidationStep],
            });
            setModalVisible(true);
          }, 1200);
        } catch (error) {
          console.error('Error during memory validation:', error);
          setDetectionStatus('waiting');
          setModalData({ type: 'error' });
          setModalVisible(true);
        }
      }
    };

    if (isCameraReady && detectionStatus === 'waiting' && isValidating) {
      performValidation();
    }
  }, [isCameraReady, detectionStatus, isValidating, currentValidationStep, commands]);

  // ── Save assessment when validation completes ────────────────────────────────
  const saveAssessment = async (correctCount, percentage) => {
    try {
      setIsSaving(true);
      const modelPrediction = {
        prediction:  correctCount === commands.length ? 1 : 0,
        probability: percentage / 100,
        features: {
          reaction_time:           0,
          sequence_accuracy:       correctCount / commands.length,
          avg_joint_angle_error:   0,
          movement_smoothness:     1.0,
          instruction_delay:       0,
          error_repetition_count:  commands.length - correctCount,
        },
      };
      await saveModelPredictionAsAssessment(
        modelPrediction,
        'MEMORY_ASSESSMENT',
        `Completed ${correctCount}/${commands.length} memory actions. Score: ${validationScore}/${commands.length * 100}`
      );
      Alert.alert('Saved! 🎉', 'Your memory assessment has been saved!');
    } catch (error) {
      console.error('[MemoryAssessment] Error saving assessment:', error);
      Alert.alert('Error', 'Failed to save assessment: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isValidationPhaseComplete && !isSaving) {
      const correctCount = completedSteps.filter(Boolean).length;
      const percentage   = Number(((correctCount / commands.length) * 100).toFixed(0));
      saveAssessment(correctCount, percentage);
    }
  }, [isValidationPhaseComplete]);

  // ── Step helpers ─────────────────────────────────────────────────────────────
  const nextStep = () => {
    setCompletedSteps((prev) => {
      const next = [...prev];
      next[currentStep] = true;
      return next;
    });
    if (currentStep < commands.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsMemoryPhaseComplete(true);
    }
  };

  const startCameraValidation = () => {
    setIsValidating(true);
    setCurrentValidationStep(0);
    setValidationResults([]);
    setCompletedSteps(Array(commands.length).fill(false));
    setValidationScore(0);
    setDetectionStatus('waiting');
  };

  const handleValidationStepResult = (success) => {
    const idx = currentValidationStep;
    setValidationResults((prev) => [...prev, { command: commands[idx], success }]);
    if (success) {
      setCompletedSteps((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      setValidationScore((prev) => prev + 100);
    }
    if (idx < commands.length - 1) {
      setCurrentValidationStep(idx + 1);
      setDetectionStatus('waiting');
    } else {
      setIsValidating(false);
      setIsValidationPhaseComplete(true);
    }
  };

  const handleModalClose = () => {
    const { type, success } = modalData || {};
    setModalVisible(false);
    if (type === 'success' || type === 'failure') {
      handleValidationStepResult(Boolean(success));
    }
    if (type === 'error') {
      setDetectionStatus('waiting');
    }
    setModalData(null);
  };

  // ── Tip helper ───────────────────────────────────────────────────────────────
  const getTip = (features, isSuccess) => {
    if (!features || Object.keys(features).length === 0) {
      return isSuccess
        ? 'Great job! Keep your movement clear and steady.'
        : 'Try to keep your full body visible to the camera.';
    }
    if (isSuccess) {
      if (features.avg_joint_angle_error !== undefined && features.avg_joint_angle_error < 30)
        return 'Excellent movement precision!';
      if (features.movement_smoothness !== undefined && features.movement_smoothness < 2)
        return 'Very smooth action execution!';
      return 'Great job! Keep your movement clear and steady.';
    }
    if (features.avg_joint_angle_error !== undefined && features.avg_joint_angle_error > 50)
      return 'Try matching the action posture more precisely.';
    if (features.movement_smoothness !== undefined && features.movement_smoothness > 4)
      return 'Try moving more smoothly and in one continuous motion.';
    if (features.instruction_delay !== undefined && features.instruction_delay > 0.1)
      return 'Try to react faster after reading the command.';
    return 'Try to keep your full body visible to the camera.';
  };

  const getPerformanceMessage = (pct) => {
    if (pct === 100) return 'Perfect! You remembered and performed all commands! 🌟';
    if (pct >= 80)   return 'Excellent! You remembered most commands correctly! 🎉';
    if (pct >= 60)   return 'Good effort! Keep practising to improve memory! 💪';
    if (pct >= 40)   return "You're doing okay! More practice will help! 🦉";
    return 'Keep practising! Memory skills improve with training! 🚀';
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
              <Icon
                name={isError ? 'warning' : isSuccess ? 'check-circle' : 'cancel'}
                size={40}
                color="white"
              />
              <Text style={styles.modalTitle}>
                {isError
                  ? 'Validation Error'
                  : isSuccess
                  ? 'Action Detected!'
                  : 'Action Not Detected'}
              </Text>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {isError ? (
                <Text style={styles.modalErrorText}>
                  Failed to process this action. Please try again.
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
                      <FeatureRow
                        icon="bolt"
                        label="Reaction Time"
                        value={`${((features.reaction_time || 0) * 1000).toFixed(0)}ms`}
                      />
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
                {isError
                  ? 'Retry'
                  : currentValidationStep === commands.length - 1
                  ? 'Finish'
                  : 'Next Action'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // ── Completion screen ────────────────────────────────────────────────────────
  if (isValidationPhaseComplete) {
    const total      = completedSteps.filter(Boolean).length;
    const percentage = ((total / commands.length) * 100).toFixed(0);

    return (
      <ScrollView style={styles.container}>
        <ResultModal />
        <View style={styles.completionScreen}>
          <Icon
            name={total === commands.length ? 'check-circle' : 'info'}
            size={100}
            color={total === commands.length ? Colors.successGreen : Colors.accentYellow}
          />
          <Text style={styles.completionTitle}>Assessment Complete! 🎉</Text>
          <Text style={styles.completionText}>
            You correctly performed {total} out of {commands.length} commands
          </Text>

          <View style={styles.scoreCard}>
            <Text style={styles.performanceText}>Performance: {percentage}%</Text>
            <Text style={styles.scoreValue}>
              Final Score: {validationScore}/{commands.length * 100}
            </Text>
            <Text style={styles.performanceMessage}>
              {getPerformanceMessage(parseInt(percentage))}
            </Text>
          </View>

          {isSaving && (
            <View style={{ paddingVertical: 12 }}>
              <Text style={styles.savingText}>Saving your results…</Text>
            </View>
          )}

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
                setCurrentStep(0);
                setCompletedSteps(Array(commands.length).fill(false));
                setIsMemoryPhaseComplete(false);
                setIsValidationPhaseComplete(false);
                setValidationScore(0);
                setValidationResults([]);
                setCurrentValidationStep(0);
                setDetectionStatus('waiting');
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

  // ── Validation phase ─────────────────────────────────────────────────────────
  if (isMemoryPhaseComplete) {
    return (
      <View style={styles.container}>
        <ResultModal />

        {/* Always-mounted hidden video for frame capture */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', width: 1, height: 1, top: 0, left: 0 }}
        />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={Colors.darkGray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Memory Test — Validation</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.validationContent}>
          {isValidating ? (
            <View style={styles.cameraValidationContainer}>
              <View style={styles.cameraView}>
                <View style={styles.cameraFrame}>
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
                </View>

                <View style={styles.detectionIndicator}>
                  {detectionStatus === 'detecting' && (
                    <>
                      <View style={styles.loadingDot} />
                      <Text style={styles.detectionText}>Analysing…</Text>
                    </>
                  )}
                  {detectionStatus === 'success' && (
                    <>
                      <Icon name="check-circle" size={40} color={Colors.successGreen} />
                      <Text style={styles.detectionText}>Action Detected!</Text>
                    </>
                  )}
                  {detectionStatus === 'failed' && (
                    <>
                      <Icon name="cancel" size={40} color="#FF5252" />
                      <Text style={styles.detectionText}>Action Not Detected</Text>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.currentCommandSection}>
                <Text style={styles.commandNumberText}>
                  Command {currentValidationStep + 1} of {commands.length}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${
                          ((currentValidationStep + 1) / commands.length) * 100
                        }%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.instructionsBox}>
                <Icon name="info" size={20} color={Colors.primaryBlue} />
                <Text style={styles.instructionsText}>
                  Perform the action in front of the camera. The AI model will
                  detect your movement.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.validationCenter}>
              <Icon name="videocam" size={80} color={Colors.primaryBlue} />
              <Text style={styles.validationTitle}>Now Show Us! 🤩</Text>
              <Text style={styles.validationText}>
                Let's validate that you can do all the commands correctly.{'\n\n'}
                Position yourself in front of the camera and perform each action
                clearly.
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={startCameraValidation}
              >
                <Text style={styles.startButtonText}>Start Camera Validation</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Remember phase ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ResultModal />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={Colors.darkGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory Test — Remember</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.memoryContent}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / commands.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {commands.length}
          </Text>
          <Text style={styles.scoreText}>
            Instructions Remembered: {completedSteps.filter(Boolean).length}/
            {commands.length}
          </Text>
        </View>

        <View style={styles.memoryCenter}>
          <Icon name="memory" size={80} color={Colors.primaryBlue} />
          <Text style={styles.memoryTitle}>Remember This:</Text>

          <View style={styles.commandCard}>
            <Text style={styles.commandText}>{commands[currentStep]}</Text>
          </View>

          {currentStep > 0 && (
            <View style={styles.previousCommands}>
              <Text style={styles.previousCommandsText}>
                You need to remember and do all these in order:
              </Text>
              <View style={styles.commandsList}>
                {commands.slice(0, currentStep + 1).map((cmd, index) => (
                  <View key={index} style={styles.commandItem}>
                    <Icon
                      name={
                        index < currentStep
                          ? 'check-circle'
                          : 'radio-button-unchecked'
                      }
                      size={20}
                      color={
                        index < currentStep ? Colors.successGreen : Colors.mediumGray
                      }
                    />
                    <Text
                      style={[
                        styles.commandItemText,
                        index === currentStep && styles.currentCommandText,
                      ]}
                    >
                      {cmd}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.rememberText}>Remember this command! 🧠</Text>

          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <Text style={styles.nextButtonText}>
              {currentStep === commands.length - 1
                ? 'Start Validation'
                : 'Got it, Next!'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundWhite,
  },
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
  memoryContent: { padding: 20 },
  validationContent: { flexGrow: 1, padding: 20 },

  // Progress bar
  progressContainer: { marginBottom: 40 },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primaryBlue,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: Colors.primaryBlue,
  },

  // Memory phase
  memoryCenter: { alignItems: 'center' },
  memoryTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    marginTop: 24,
    marginBottom: 16,
    color: Colors.textDark,
  },
  commandCard: {
    width: '100%',
    padding: 20,
    backgroundColor: `${Colors.primaryBlue}20`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Colors.primaryBlue}40`,
    marginBottom: 32,
  },
  commandText: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: Colors.primaryBlue,
    textAlign: 'center',
  },
  previousCommands: { width: '100%', marginBottom: 24 },
  previousCommandsText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    textAlign: 'center',
    marginBottom: 12,
  },
  commandsList: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8 },
  commandItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  commandItemText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: Colors.textDark,
    marginLeft: 8,
  },
  currentCommandText: { fontFamily: fonts.bold },
  rememberText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.bold,
  },

  // Validation phase start
  validationCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  validationTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    marginTop: 24,
    marginBottom: 16,
    color: Colors.textDark,
  },
  validationText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.bold,
  },

  // Camera validation
  cameraValidationContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  cameraView: { marginBottom: 20 },
  cameraFrame: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#000',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.primaryBlue,
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
  detectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: `${Colors.primaryBlue}15`,
    gap: 8,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accentYellow,
    opacity: 0.8,
  },
  detectionText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: Colors.textDark,
  },
  currentCommandSection: { marginBottom: 20 },
  commandNumberText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: Colors.mediumGray,
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionsBox: {
    flexDirection: 'row',
    backgroundColor: `${Colors.primaryBlue}10`,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: Colors.textDark,
    lineHeight: 20,
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
    marginBottom: 32,
  },
  performanceText: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: Colors.primaryBlue,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 18,
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
    fontSize: 15,
  },
  tryAgainButton: { backgroundColor: Colors.primaryBlue },
  tryAgainButtonText: {
    fontFamily: fonts.bold,
    color: 'white',
    fontSize: 15,
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
  modalTitle: {
    fontSize: 18,
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
});

export default MemoryAssessmentScreen;
