
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ArrowRight, Check, X, Loader2, RotateCcw, History, BookOpen, Moon, Sun } from 'lucide-react';
import { useTheme } from "next-themes";

const STORAGE_KEY = 'quiz_history';
const WRONG_ANSWERS_KEY = 'wrong_answers';
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex justify-end items-center gap-2 mb-4">
      <Sun className="h-4 w-4" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
      />
      <Moon className="h-4 w-4" />
    </div>
  );
};
const QuizApp = () => {
  const [allQuestions, setAllQuestions] = useState([]); // 儲存所有原始題目
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [mode, setMode] = useState('practice'); // 'practice' or 'review'
  const [history, setHistory] = useState([]);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [activeTab, setActiveTab] = useState('practice');

  const getUnsolvedQuestions = (allQuestions, history) => {
    const solvedQuestionTexts = new Set(history.map(item => item.question));
    return allQuestions.filter(question => !solvedQuestionTexts.has(question.question));
  };
  // 載入題目和歷史記錄
  useEffect(() => {
    const loadQuestionsAndHistory = async () => {
      try {
        const response = await fetch('/ipas_questions_cleaned.json');
        if (!response.ok) {
          throw new Error('Failed to load questions');
        }
        const data = await response.json();
        setAllQuestions(data);

        const savedHistory = localStorage.getItem(STORAGE_KEY);
        const savedHistoryData = savedHistory ? JSON.parse(savedHistory) : [];
        setHistory(savedHistoryData);

        // 過濾出未作答的題目並打亂順序
        const unsolvedQuestions = getUnsolvedQuestions(data, savedHistoryData);
        const shuffledQuestions = [...unsolvedQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);

        const savedWrongAnswers = localStorage.getItem(WRONG_ANSWERS_KEY);
        if (savedWrongAnswers) {
          setWrongAnswers(JSON.parse(savedWrongAnswers));
        }

        setLoading(false);
      } catch (err) {
        setError('無法載入題目，請重新整理頁面');
        setLoading(false);
      }
    };

    loadQuestionsAndHistory();
  }, []);

  const saveHistory = (questionData) => {
    const newHistory = [...history, questionData];
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const saveWrongAnswer = (questionData) => {
    if (!wrongAnswers.some(q => q.question === questionData.question)) {
      const newWrongAnswers = [...wrongAnswers, questionData];
      setWrongAnswers(newWrongAnswers);
      localStorage.setItem(WRONG_ANSWERS_KEY, JSON.stringify(newWrongAnswers));
    }
  };

  const handleAnswerSelect = (option) => {
    if (isAnswered) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correct_answer;

    setSelectedAnswer(option);
    setIsAnswered(true);
    setShowFeedback(true);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      saveWrongAnswer({
        ...currentQuestion,
        userAnswer: option,
        timestamp: new Date().toISOString()
      });
    }

    saveHistory({
      ...currentQuestion,
      userAnswer: option,
      isCorrect,
      timestamp: new Date().toISOString()
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowFeedback(false);
    }
  };

  const startNormalPractice = () => {
    const unsolvedQuestions = getUnsolvedQuestions(allQuestions, history);

    if (unsolvedQuestions.length === 0) {
      // 如果所有題目都已作答，詢問是否要重新開始
      if (window.confirm('您已完成所有題目！是否要清除歷史重新開始？')) {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
        const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
      }
    } else {
      const shuffledQuestions = [...unsolvedQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffledQuestions);
    }

    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowFeedback(false);
    setCorrectCount(0);
    setMode('practice');
    setActiveTab('practice');
  };

  const unsolvedCount = getUnsolvedQuestions(allQuestions, history).length;



  const startWrongAnswersReview = () => {
    if (wrongAnswers.length === 0) {
      setError('目前沒有錯題紀錄');
      return;
    }
    const shuffledWrongQuestions = [...wrongAnswers].sort(() => Math.random() - 0.5);
    setQuestions(shuffledWrongQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowFeedback(false);
    setCorrectCount(0);
    setMode('review');
    setActiveTab('practice');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const clearWrongAnswers = () => {
    setWrongAnswers([]);
    localStorage.removeItem(WRONG_ANSWERS_KEY);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
        <p className="text-gray-500">載入題目中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((allQuestions.length - unsolvedCount + 1) / allQuestions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <ThemeToggle />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="practice">練習模式</TabsTrigger>
          <TabsTrigger value="wrong-answers">錯題複習</TabsTrigger>
          <TabsTrigger value="history">歷史紀錄</TabsTrigger>
        </TabsList>

        <TabsContent value="practice">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>
                    IPAS 題目{mode === 'review' ? '錯題複習' : '練習'}
                    {mode === 'practice' && (
                      <span className="text-sm text-gray-500 ml-2">
                        (還有 {unsolvedCount} 題未作答)
                      </span>
                    )}
                  </span>
                  {mode === 'review' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startNormalPractice}
                      className="ml-2"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      回到一般練習
                    </Button>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  題目 {allQuestions.length - unsolvedCount + 1} / {allQuestions.length}
                </span>
              </CardTitle>
              <Progress value={progress} className="w-full" />

            </CardHeader>

            <CardContent>
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">
                  {currentQuestion.year} 年度題目
                </div>
                <div className="text-lg mb-6">
                  {currentQuestion.question}
                </div>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={
                        selectedAnswer === option
                          ? option === currentQuestion.correct_answer
                            ? "success"
                            : "destructive"
                          : "outline"
                      }
                      className="w-full justify-start text-left"
                      onClick={() => handleAnswerSelect(option)}
                      disabled={isAnswered}
                    >
                      {selectedAnswer === option && (
                        option === currentQuestion.correct_answer
                          ? <Check className="mr-2 h-4 w-4" />
                          : <X className="mr-2 h-4 w-4" />
                      )}
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                正確率: {Math.round((correctCount / (currentQuestionIndex + 1)) * 100)}%
              </div>
              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={mode === 'review' ? startNormalPractice : startWrongAnswersReview} variant="default">
                  {mode === 'review' ? '回到一般練習' : '重新開始'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!isAnswered}
                >
                  下一題 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>

          {showFeedback && (
            <Alert variant={selectedAnswer === currentQuestion.correct_answer ? "success" : "destructive"} className="mt-4">
              <AlertDescription>
                {selectedAnswer === currentQuestion.correct_answer
                  ? "答對了！"
                  : `答錯了！正確答案是: ${currentQuestion.correct_answer}`
                }
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="wrong-answers">
          <Card>
            <CardHeader>
              <CardTitle>錯題複習</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  共有 {wrongAnswers.length} 題錯題
                </div>
                <div className="flex gap-4">
                  <Button onClick={startWrongAnswersReview}>
                    開始複習錯題
                  </Button>
                  <Button variant="outline" onClick={clearWrongAnswers}>
                    清除錯題紀錄
                  </Button>
                </div>
                <div className="space-y-4">
                  {wrongAnswers.map((item, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <div className="mb-2">{item.question}</div>
                      <div className="text-red-500">您的答案: {item.userAnswer}</div>
                      <div className="text-green-500">正確答案: {item.correct_answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>答題歷史</span>
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  清除歷史
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    <div className="mb-2">{item.question}</div>
                    <div className={item.isCorrect ? "text-green-500" : "text-red-500"}>
                      {item.isCorrect ? "答對" : "答錯"}
                    </div>
                    <div className="text-sm text-gray-500">
                      您的答案: {item.userAnswer}
                      {!item.isCorrect && (
                        <div className="text-green-500">
                          正確答案: {item.correct_answer}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizApp;
