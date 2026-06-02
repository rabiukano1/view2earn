import { useState, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeInRight, FadeInLeft } from 'react-native-reanimated';

import { SmartHeader } from '@/components/smart-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RewardToast } from '@/components/reward-toast';
import { useMockData, AIDynamicTask, AIQuiz } from '@/context/MockDataContext';

const TYPE_COLORS: Record<string, string> = {
  daily: '#2ECC71',
  weekly: '#3B82F6',
  challenge: '#8B5CF6',
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  daily: 'today-outline',
  weekly: 'calendar-outline',
  challenge: 'trophy-outline',
};

export default function DailyChallengesScreen() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useMockData();
  const [tab, setTab] = useState<'tasks' | 'quizzes'>('tasks');
  const [showQuiz, setShowQuiz] = useState<AIQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    passed: boolean;
    details: { correct: boolean }[];
  } | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayChallenge = useMemo(() =>
    state.dailyChallenges.find(d => d.date === today),
    [state.dailyChallenges, today]
  );

  const availableTasks = useMemo(() =>
    state.aiTasks.filter(t => t.active && !todayChallenge?.completedTaskIds.includes(t.id)),
    [state.aiTasks, todayChallenge]
  );

  const completedTasks = useMemo(() =>
    state.aiTasks.filter(t => todayChallenge?.completedTaskIds.includes(t.id)),
    [state.aiTasks, todayChallenge]
  );

  const availableQuizzes = useMemo(() =>
    state.aiQuizzes.filter(q => q.active && !todayChallenge?.completedQuizIds.includes(q.id)),
    [state.aiQuizzes, todayChallenge]
  );

  const completedQuizzes = useMemo(() =>
    state.aiQuizzes.filter(q => todayChallenge?.completedQuizIds.includes(q.id)),
    [state.aiQuizzes, todayChallenge]
  );

  const handleCompleteTask = (task: AIDynamicTask) => {
    dispatch({ type: 'COMPLETE_AI_TASK', taskId: task.id, reward: task.reward });
    setRewardAmount(task.reward);
    setShowReward(true);
  };

  const handleStartQuiz = (quiz: AIQuiz) => {
    setShowQuiz(quiz);
    setQuizAnswers(new Array(quiz.questions.length).fill(-1));
    setCurrentQuestion(0);
  };

  const handleSubmitQuiz = () => {
    if (!showQuiz) return;
    const details = showQuiz.questions.map((q, i) => ({
      correct: quizAnswers[i] === q.correctIndex,
    }));
    const score = details.filter(d => d.correct).length;
    const passed = score >= showQuiz.passingScore;
    setQuizResult({ score, total: showQuiz.questions.length, passed, details });
  };

  const handleDismissResult = () => {
    if (!quizResult || !showQuiz) return;
    if (quizResult.passed) {
      dispatch({ type: 'COMPLETE_QUIZ', quizId: showQuiz.id, reward: showQuiz.reward });
      setRewardAmount(showQuiz.reward);
      setShowReward(true);
    } else {
      setRewardAmount(0);
      setShowReward(true);
    }
    setShowQuiz(null);
    setQuizResult(null);
  };

  const handleCloseQuiz = () => {
    setShowQuiz(null);
    setQuizAnswers([]);
    setQuizResult(null);
  };

  const totalEarned = todayChallenge?.totalEarned || 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <SmartHeader
        title="Daily Challenges"
        subtitle="Complete tasks & quizzes to earn PTS"
        rightContent={
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        }
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.springify().damping(15)}>
          <LinearGradient
            colors={['#1a3a2a', '#0f1f18']}
            style={styles.earningsCard}
          >
            <View style={styles.earningsTop}>
              <View style={styles.earningsIconWrap}>
                <Ionicons name="sparkles" size={22} color="#2ECC71" />
              </View>
              <View style={styles.earningsInfo}>
                <ThemedText style={styles.earningsLabel}>Today's Earnings</ThemedText>
                <ThemedText style={styles.earningsAmount}>{totalEarned} PTS</ThemedText>
              </View>
            </View>
            <View style={styles.earningsBadgeRow}>
              <View style={[styles.earningsBadge, { backgroundColor: '#2ECC7115' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#2ECC71" />
                <ThemedText style={styles.earningsBadgeText}>
                  {todayChallenge?.completedTaskIds.length || 0} tasks
                </ThemedText>
              </View>
              <View style={[styles.earningsBadge, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
                <ThemedText style={styles.earningsBadgeText}>
                  {todayChallenge?.completedQuizIds.length || 0} quizzes
                </ThemedText>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setTab('tasks')}
            style={[styles.tabBtn, tab === 'tasks' && { backgroundColor: '#2ECC7115', borderColor: '#2ECC71' }]}
          >
            <Ionicons name="list-outline" size={18} color={tab === 'tasks' ? '#2ECC71' : '#8B949E'} />
            <ThemedText style={[styles.tabText, tab === 'tasks' && { color: '#2ECC71', fontWeight: '700' }]}>
              Tasks ({availableTasks.length})
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setTab('quizzes')}
            style={[styles.tabBtn, tab === 'quizzes' && { backgroundColor: '#3B82F615', borderColor: '#3B82F6' }]}
          >
            <Ionicons name="help-circle-outline" size={18} color={tab === 'quizzes' ? '#3B82F6' : '#8B949E'} />
            <ThemedText style={[styles.tabText, tab === 'quizzes' && { color: '#3B82F6', fontWeight: '700' }]}>
              Quizzes ({availableQuizzes.length})
            </ThemedText>
          </Pressable>
        </View>

        {tab === 'tasks' ? (
          <>
            {availableTasks.length === 0 && completedTasks.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="sparkles-outline" size={48} color="rgba(255,255,255,0.15)" />
                <ThemedText style={styles.emptyTitle}>No Tasks Available</ThemedText>
                <ThemedText style={styles.emptySub}>Check back later for new challenges</ThemedText>
              </View>
            )}
            {availableTasks.map((task, i) => (
              <Animated.View key={task.id} entering={FadeInDown.delay(i * 60).springify().damping(15)}>
                <ThemedView type="backgroundElement" style={[styles.taskCard, { borderLeftColor: TYPE_COLORS[task.type] || '#2ECC71', borderLeftWidth: 3 }]}>
                  <View style={styles.taskTop}>
                    <View style={styles.taskIconWrap}>
                      <Ionicons name={(task.icon || 'star') as any} size={22} color={TYPE_COLORS[task.type] || '#2ECC71'} />
                    </View>
                    <View style={styles.taskInfo}>
                      <ThemedText style={styles.taskTitle}>{task.title}</ThemedText>
                      <ThemedText style={styles.taskDesc}>{task.description}</ThemedText>
                    </View>
                    <ThemedText style={[styles.taskReward, { color: TYPE_COLORS[task.type] || '#2ECC71' }]}>
                      +{task.reward}
                    </ThemedText>
                  </View>
                  <View style={styles.taskBottom}>
                    <View style={[styles.taskTypeBadge, { backgroundColor: (TYPE_COLORS[task.type] || '#2ECC71') + '15' }]}>
                      <Ionicons name={TYPE_ICONS[task.type] || 'today-outline'} size={12} color={TYPE_COLORS[task.type] || '#2ECC71'} />
                      <ThemedText style={[styles.taskTypeText, { color: TYPE_COLORS[task.type] || '#2ECC71' }]}>
                        {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                      </ThemedText>
                    </View>
                    {task.instructions && (
                      <ThemedText style={styles.taskInstruction}>{task.instructions}</ThemedText>
                    )}
                    <Pressable
                      onPress={() => handleCompleteTask(task)}
                      style={({ pressed }) => [styles.claimBtn, pressed && { opacity: 0.85 }]}
                    >
                      <LinearGradient colors={['#2ECC71', '#27ae60']} style={styles.claimGradient}>
                        <Ionicons name="checkmark" size={18} color="#000" />
                        <ThemedText style={styles.claimText}>Complete</ThemedText>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </ThemedView>
              </Animated.View>
            ))}
            {completedTasks.map((task, i) => (
              <Animated.View key={task.id} entering={FadeInDown.delay(i * 60).springify().damping(15)}>
                <ThemedView type="backgroundElement" style={[styles.taskCard, { opacity: 0.5 }]}>
                  <View style={styles.taskTop}>
                    <View style={styles.taskIconWrap}>
                      <Ionicons name="checkmark-circle" size={22} color="#2ECC71" />
                    </View>
                    <View style={styles.taskInfo}>
                      <ThemedText style={[styles.taskTitle, { textDecorationLine: 'line-through' }]}>{task.title}</ThemedText>
                      <ThemedText style={styles.taskDesc}>Completed</ThemedText>
                    </View>
                    <ThemedText style={[styles.taskReward, { color: '#2ECC71' }]}>+{task.reward}</ThemedText>
                  </View>
                </ThemedView>
              </Animated.View>
            ))}
          </>
        ) : (
          <>
            {availableQuizzes.length === 0 && completedQuizzes.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="help-circle-outline" size={48} color="rgba(255,255,255,0.15)" />
                <ThemedText style={styles.emptyTitle}>No Quizzes Available</ThemedText>
                <ThemedText style={styles.emptySub}>Check back later for new quizzes</ThemedText>
              </View>
            )}
            {availableQuizzes.map((quiz, i) => (
              <Animated.View key={quiz.id} entering={FadeInDown.delay(i * 60).springify().damping(15)}>
                <ThemedView type="backgroundElement" style={[styles.taskCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 3 }]}>
                  <View style={styles.taskTop}>
                    <View style={[styles.taskIconWrap, { backgroundColor: '#3B82F615' }]}>
                      <Ionicons name="help-circle" size={22} color="#3B82F6" />
                    </View>
                    <View style={styles.taskInfo}>
                      <ThemedText style={styles.taskTitle}>{quiz.title}</ThemedText>
                      <ThemedText style={styles.taskDesc}>{quiz.description}</ThemedText>
                    </View>
                    <ThemedText style={[styles.taskReward, { color: '#3B82F6' }]}>+{quiz.reward}</ThemedText>
                  </View>
                  <View style={styles.taskBottom}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <ThemedText style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        {quiz.questions.length} questions
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        • Pass: {quiz.passingScore}/{quiz.questions.length}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => handleStartQuiz(quiz)}
                      style={({ pressed }) => [styles.claimBtn, pressed && { opacity: 0.85 }]}
                    >
                      <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.claimGradient}>
                        <Ionicons name="play" size={18} color="#fff" />
                        <ThemedText style={[styles.claimText, { color: '#fff' }]}>Start Quiz</ThemedText>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </ThemedView>
              </Animated.View>
            ))}
            {completedQuizzes.map((quiz, i) => (
              <Animated.View key={quiz.id} entering={FadeInDown.delay(i * 60).springify().damping(15)}>
                <ThemedView type="backgroundElement" style={[styles.taskCard, { opacity: 0.5 }]}>
                  <View style={styles.taskTop}>
                    <View style={[styles.taskIconWrap, { backgroundColor: '#2ECC7115' }]}>
                      <Ionicons name="checkmark-circle" size={22} color="#2ECC71" />
                    </View>
                    <View style={styles.taskInfo}>
                      <ThemedText style={[styles.taskTitle, { textDecorationLine: 'line-through' }]}>{quiz.title}</ThemedText>
                      <ThemedText style={styles.taskDesc}>Completed</ThemedText>
                    </View>
                    <ThemedText style={[styles.taskReward, { color: '#2ECC71' }]}>+{quiz.reward}</ThemedText>
                  </View>
                </ThemedView>
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={!!showQuiz} transparent animationType="fade" onRequestClose={handleCloseQuiz}>
        <View style={styles.quizOverlay}>
          <View style={styles.quizContainer}>
            {showQuiz && !quizResult && (
              <>
                <View style={styles.quizHeader}>
                  <View style={styles.quizDotsRow}>
                    {showQuiz.questions.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.quizDot,
                          i < currentQuestion && styles.quizDotDone,
                          i === currentQuestion && styles.quizDotActive,
                        ]}
                      />
                    ))}
                    <ThemedText style={styles.quizDotLabel}>
                      {currentQuestion + 1}/{showQuiz.questions.length}
                    </ThemedText>
                  </View>
                </View>
                <ScrollView style={styles.quizScroll} contentContainerStyle={styles.questionScrollContent}>
                  <Animated.View
                    key={currentQuestion}
                    entering={FadeInRight.duration(250).springify().damping(20)}
                    exiting={FadeInLeft.duration(150)}
                  >
                    {(() => {
                      const q = showQuiz.questions[currentQuestion];
                      return (
                        <View style={styles.questionCard}>
                          <ThemedText style={styles.questionNumber}>Question {currentQuestion + 1}</ThemedText>
                          <ThemedText style={styles.questionText}>{q.text}</ThemedText>
                          <View style={styles.optionsContainer}>
                            {q.options.map((opt, oi) => {
                              const selected = quizAnswers[currentQuestion] === oi;
                              return (
                                <Pressable
                                  key={oi}
                                  onPress={() => {
                                    const a = [...quizAnswers];
                                    a[currentQuestion] = oi;
                                    setQuizAnswers(a);
                                  }}
                                  style={({ pressed }) => [
                                    styles.optionBtn,
                                    selected && styles.optionBtnSelected,
                                    pressed && !selected && styles.optionBtnPressed,
                                  ]}
                                >
                                  <View style={[styles.optionRadio, selected && styles.optionRadioSelected]}>
                                    {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                                  </View>
                                  <ThemedText style={[styles.optionText, selected && styles.optionTextSelected]}>
                                    {opt}
                                  </ThemedText>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })()}
                  </Animated.View>
                </ScrollView>
                <View style={styles.quizFooter}>
                  <Pressable
                    onPress={currentQuestion > 0 ? () => setCurrentQuestion(c => c - 1) : handleCloseQuiz}
                    style={({ pressed }) => [
                      styles.footerBtn,
                      currentQuestion === 0 && styles.footerBtnOutline,
                      currentQuestion > 0 && styles.footerBtnGhost,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons
                      name={currentQuestion > 0 ? 'arrow-back' : 'close-outline'}
                      size={20}
                      color={currentQuestion > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.4)'}
                    />
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  {currentQuestion < showQuiz.questions.length - 1 ? (
                    <Pressable
                      onPress={() => {
                        if (quizAnswers[currentQuestion] === -1) return;
                        setCurrentQuestion(c => c + 1);
                      }}
                      style={({ pressed }) => [
                        styles.footerBtn,
                        styles.footerBtnPrimary,
                        quizAnswers[currentQuestion] === -1 && styles.footerBtnDisabled,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={quizAnswers[currentQuestion] === -1 ? 'rgba(255,255,255,0.2)' : '#fff'}
                      />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={handleSubmitQuiz}
                      style={({ pressed }) => [
                        styles.footerBtn,
                        styles.footerBtnSubmit,
                        quizAnswers.some(a => a === -1) && styles.footerBtnDisabled,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-done"
                        size={20}
                        color={quizAnswers.some(a => a === -1) ? 'rgba(0,0,0,0.2)' : '#000'}
                      />
                    </Pressable>
                  )}
                </View>
              </>
            )}
            {showQuiz && quizResult && (
              <>
                <View style={styles.quizHeader}>
                  <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.resultCircle}>
                    <LinearGradient
                      colors={quizResult.passed ? ['#2ECC71', '#27ae60'] : ['#EF4444', '#DC2626']}
                      style={styles.resultCircleGrad}
                    >
                      <Ionicons
                        name={quizResult.passed ? 'checkmark' : 'close'}
                        size={32}
                        color="#fff"
                      />
                    </LinearGradient>
                  </Animated.View>
                  <Animated.View entering={FadeInUp.delay(150).duration(400).springify()} style={{ alignItems: 'center', gap: 4 }}>
                    <ThemedText style={[styles.resultTitle, { color: quizResult.passed ? '#2ECC71' : '#EF4444' }]}>
                      {quizResult.passed ? 'Passed!' : 'Failed'}
                    </ThemedText>
                    <ThemedText style={styles.resultScore}>
                      {quizResult.score}/{quizResult.total} correct
                    </ThemedText>
                    {!quizResult.passed && (
                      <ThemedText style={styles.resultHint}>
                        Need {showQuiz.passingScore}/{quizResult.total} to pass
                      </ThemedText>
                    )}
                  </Animated.View>
                </View>
                <ScrollView style={styles.quizScroll} contentContainerStyle={{ padding: 16, gap: 10 }}>
                  {showQuiz.questions.map((q, qi) => {
                    const detail = quizResult.details[qi];
                    return (
                      <Animated.View key={q.id} entering={FadeInRight.delay(qi * 80).duration(300).springify().damping(20)}>
                        <View style={[styles.resultQCard, { borderLeftColor: detail.correct ? '#2ECC71' : '#EF4444' }]}>
                          <View style={styles.resultQHeader}>
                            <ThemedText style={styles.resultQNum}>{qi + 1}</ThemedText>
                            <Ionicons
                              name={detail.correct ? 'checkmark-circle' : 'close-circle'}
                              size={18}
                              color={detail.correct ? '#2ECC71' : '#EF4444'}
                            />
                          </View>
                          <ThemedText style={styles.resultQText}>{q.text}</ThemedText>
                          <View style={{ gap: 6, marginTop: 10 }}>
                            {q.options.map((opt, oi) => {
                              const isCorrect = oi === q.correctIndex;
                              const wasChosen = quizAnswers[qi] === oi;
                              return (
                                <View
                                  key={oi}
                                  style={[
                                    styles.resultOptRow,
                                    isCorrect && styles.resultOptCorrect,
                                    wasChosen && !isCorrect && styles.resultOptWrong,
                                  ]}
                                >
                                  <View style={[styles.resultOptDot, isCorrect && { backgroundColor: '#2ECC71' }, wasChosen && !isCorrect && { backgroundColor: '#EF4444' }]}>
                                    {isCorrect && <Ionicons name="checkmark" size={10} color="#fff" />}
                                    {wasChosen && !isCorrect && <Ionicons name="close" size={10} color="#fff" />}
                                  </View>
                                  <ThemedText
                                    style={[
                                      styles.resultOptText,
                                      isCorrect && { color: '#2ECC71' },
                                      wasChosen && !isCorrect && { color: '#EF4444' },
                                    ]}
                                  >
                                    {opt}
                                  </ThemedText>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </Animated.View>
                    );
                  })}
                </ScrollView>
                <View style={styles.quizFooter}>
                  <Pressable
                    onPress={handleDismissResult}
                    style={({ pressed }) => [{
                      flex: 1, paddingVertical: 14, borderRadius: 16,
                      backgroundColor: quizResult.passed ? '#2ECC71' : 'rgba(255,255,255,0.06)',
                      alignItems: 'center',
                    }, pressed && { opacity: 0.85 }]}
                  >
                    <ThemedText style={{
                      fontSize: 15, fontWeight: '800',
                      color: quizResult.passed ? '#000' : 'rgba(255,255,255,0.5)',
                    }}>
                      {quizResult.passed ? 'Claim Reward' : 'Close'}
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <RewardToast
        visible={showReward}
        points={rewardAmount}
        onDismiss={() => setShowReward(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  earningsCard: {
    borderRadius: 24, padding: 20, gap: 14,
  },
  earningsTop: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  earningsIconWrap: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(46,204,113,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  earningsInfo: { gap: 2 },
  earningsLabel: {
    fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)',
  },
  earningsAmount: {
    fontSize: 28, fontWeight: '900', color: '#2ECC71',
  },
  earningsBadgeRow: {
    flexDirection: 'row', gap: 10,
  },
  earningsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  earningsBadgeText: {
    fontSize: 12, fontWeight: '600', color: '#fff',
  },
  tabRow: {
    flexDirection: 'row', gap: 10,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tabText: {
    fontSize: 13, fontWeight: '600', color: '#8B949E',
  },
  taskCard: {
    borderRadius: 20, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  taskTop: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
  },
  taskIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  taskInfo: { flex: 1, gap: 2 },
  taskTitle: {
    fontSize: 15, fontWeight: '800', color: '#fff',
  },
  taskDesc: {
    fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 16,
  },
  taskReward: {
    fontSize: 16, fontWeight: '900',
  },
  taskBottom: {
    gap: 10,
  },
  taskTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  taskTypeText: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
  },
  taskInstruction: {
    fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic',
  },
  claimBtn: {
    borderRadius: 14, overflow: 'hidden', alignSelf: 'flex-end',
  },
  claimGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14,
  },
  claimText: {
    fontSize: 13, fontWeight: '800', color: '#000',
  },
  emptyState: {
    alignItems: 'center', paddingVertical: 60, gap: 10,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
  },
  emptySub: {
    fontSize: 13, color: 'rgba(255,255,255,0.25)',
  },
  quizOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', padding: 16,
  },
  quizContainer: {
    backgroundColor: '#1a1a2e', borderRadius: 28,
    maxHeight: '90%', overflow: 'hidden',
  },
  quizHeader: {
    padding: 20, gap: 6, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  quizScroll: {
    maxHeight: 420,
  },
  questionScrollContent: {
    padding: 20, gap: 0,
  },
  quizDotsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  quizDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  quizDotDone: {
    backgroundColor: '#3B82F6',
    width: 8,
  },
  quizDotActive: {
    backgroundColor: '#3B82F6',
    width: 24, borderRadius: 4,
  },
  quizDotLabel: {
    marginLeft: 8, fontSize: 12, fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  optionsContainer: {
    gap: 12, marginTop: 20, paddingBottom: 8,
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
    padding: 20, gap: 8,
  },
  questionNumber: {
    fontSize: 11, fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 15, fontWeight: '600', color: '#fff',
  },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  optionBtnSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F612',
  },
  optionBtnPressed: {
    opacity: 0.8, transform: [{ scale: 0.98 }],
  },
  optionRadio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionRadioSelected: {
    backgroundColor: '#3B82F6', borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 15, color: 'rgba(255,255,255,0.7)', flex: 1,
  },
  optionTextSelected: {
    color: '#fff', fontWeight: '600',
  },
  quizFooter: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  footerBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  footerBtnOutline: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  footerBtnGhost: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  footerBtnPrimary: {
    backgroundColor: '#3B82F6',
  },
  footerBtnSubmit: {
    backgroundColor: '#2ECC71', width: 52, height: 52, borderRadius: 26,
  },
  footerBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  resultCircle: {
    alignItems: 'center', paddingTop: 8,
  },
  resultCircleGrad: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 22, fontWeight: '900',
  },
  resultScore: {
    fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.6)',
  },
  resultHint: {
    fontSize: 13, color: 'rgba(255,255,255,0.4)',
  },
  resultQCard: {
    backgroundColor: 'rgba(255,255,255,0.025)', borderRadius: 16,
    padding: 14, borderLeftWidth: 3, gap: 6,
  },
  resultQHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  resultQNum: {
    fontSize: 11, fontWeight: '700', color: '#3B82F6',
  },
  resultQText: {
    fontSize: 14, fontWeight: '600', color: '#fff',
  },
  resultOptRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(255,255,255,0.015)',
  },
  resultOptCorrect: {
    backgroundColor: '#2ECC7108', borderColor: '#2ECC7130',
  },
  resultOptWrong: {
    backgroundColor: '#EF444408', borderColor: '#EF444430',
  },
  resultOptDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  resultOptText: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
  },
});
