import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector, useAppDispatch } from '../../hooks/redux-hooks';
import { useQuizWebSocket, useSubmitAnswer } from '../../hooks/websocket-hooks';
import { updateUserAnswer } from '../../store/quiz/slice';
import { DynamicQuestionCard, DynamicResultsPanel } from './DynamicImports';
import Button from '../common/Button';
import ApiErrorAlert from '../common/ApiErrorAlert';

interface ActiveQuizProps {
  quizId: number;
}

/**
 * Компонент для отображения и управления активной викториной через WebSocket
 * Оптимизирован с использованием хуков useCallback и useMemo для предотвращения лишних ререндеров
 */
const ActiveQuiz: React.FC<ActiveQuizProps> = ({ quizId }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isConnected } = useQuizWebSocket(quizId);
  const { submitAnswer, submitLoading, submitError } = useSubmitAnswer();
  
  // Получаем состояние викторины из Redux
  const { 
    activeQuiz, 
    currentQuestion,
    remainingTime,
    quizStatus,
    userAnswers,
    results,
    leaderboard,
    error
  } = useAppSelector(state => state.quiz);
  
  // Локальное состояние для управления ответами и UI
  const [hasSubmittedCurrentAnswer, setHasSubmittedCurrentAnswer] = useState(false);
  const [correctOptionId, setCorrectOptionId] = useState<number | null>(null);
  
  // Дополнительный эффект для логирования изменений состояния викторины
  useEffect(() => {
    console.log('ActiveQuiz: изменение состояния викторины', {
      quizStatus,
      activeQuiz: activeQuiz?.id, 
      currentQuestion: currentQuestion?.id,
      remainingTime
    });
  }, [quizStatus, activeQuiz, currentQuestion, remainingTime]);
  
  // Сбрасываем состояние при изменении вопроса
  useEffect(() => {
    if (currentQuestion) {
      setHasSubmittedCurrentAnswer(false);
      setCorrectOptionId(null);
    }
  }, [currentQuestion?.id]);
  
  // Мемоизированный обработчик отправки ответа
  const handleAnswer = useCallback(async (answerId: string) => {
    if (!currentQuestion || hasSubmittedCurrentAnswer) return;
    
    try {
      // Отправляем ответ через WebSocket
      await submitAnswer({
        quizId,
        questionId: currentQuestion.id,
        answerId
      });
      
      // Обновляем состояние в Redux
      dispatch(updateUserAnswer({
        quizId: quizId,
        questionId: currentQuestion.id,
        optionId: Number(answerId),
        isCorrect: false, // Пока не знаем правильно или нет
        answerTimeMs: 0, // Это придет с сервера
        pointsEarned: 0 // Это придет с сервера
      }));
      
      // Обновляем локальное состояние
      setHasSubmittedCurrentAnswer(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  }, [currentQuestion, hasSubmittedCurrentAnswer, quizId, submitAnswer, dispatch]);
  
  // Мемоизированный обработчик пропуска вопроса
  const handleSkipQuestion = useCallback(() => {
    setHasSubmittedCurrentAnswer(true);
    // Можно добавить дополнительную логику для пропуска вопроса
  }, []);
  
  // Функция для определения типа контента, который нужно отобразить
  const contentType = useMemo(() => {
    if (error) return 'error';
    if (quizStatus === 'ended') return 'results';
    if (quizStatus === 'cancelled') return 'cancelled';
    if (currentQuestion && quizStatus === 'active') return 'question';
    if (quizStatus === 'waiting' || (quizStatus === 'active' && !currentQuestion)) return 'waiting';
    return 'default';
  }, [error, quizStatus, currentQuestion]);
  
  // Рендеринг содержимого в зависимости от статуса викторины
  const renderContent = useCallback(() => {
    switch (contentType) {
      case 'error':
        return (
          <ApiErrorAlert 
            error={error}
            className="mb-4"
            onRetry={() => router.push(`/quizzes/${quizId}`)}
          />
        );
        
      case 'results':
        return (
          <DynamicResultsPanel
            quizId={quizId}
            quizTitle={activeQuiz?.title || 'Викторина'}
            results={results}
            leaderboard={leaderboard}
            showAllResultsButton={true}
          />
        );
        
      case 'cancelled':
        return (
          <div className="bg-orange-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-orange-800 mb-2">Викторина отменена</h3>
            <p className="text-sm text-orange-600">
              Викторина была отменена. Приносим извинения за неудобства.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push('/quizzes')}>
                Вернуться к списку викторин
              </Button>
            </div>
          </div>
        );
        
      case 'question':
        if (!currentQuestion) return null;
        
        return (
          <DynamicQuestionCard
            question={currentQuestion}
            remainingTime={remainingTime}
            isSubmitting={submitLoading}
            disabled={hasSubmittedCurrentAnswer}
            hasSubmitted={hasSubmittedCurrentAnswer}
            correctOptionId={correctOptionId}
            onAnswer={handleAnswer}
            onSkip={handleSkipQuestion}
          />
        );
        
      case 'waiting':
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {activeQuiz?.title || 'Викторина'}
              </h2>
              <p className="text-gray-600 mb-4">
                {quizStatus === 'waiting' 
                  ? 'Ожидание начала викторины...' 
                  : 'Подготовка следующего вопроса...'}
              </p>
              
              {/* Отображаем таймер обратного отсчета, если он есть */}
              {remainingTime !== null && remainingTime > 0 && (
                <div className="my-4">
                  <p className="text-sm text-gray-500 mb-2">Начало через:</p>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              )}
              
              <div className="flex justify-center mt-4">
                <div className="animate-pulse h-8 w-8">
                  <svg className="h-full w-full text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Добавляем отладочную информацию */}
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left">
                <p>Статус: {quizStatus}</p>
                <p>Таймер: {remainingTime !== null ? remainingTime : 'не установлен'}</p>
                <p>ID викторины: {activeQuiz?.id || 'нет'}</p>
                <p>Вопрос: {currentQuestion ? 'загружен' : 'не загружен'}</p>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Нет активной викторины
              </h2>
              <p className="text-gray-600 mb-4">
                В данный момент нет активной викторины.
              </p>
              <Button variant="outline" onClick={() => router.push('/quizzes')}>
                Вернуться к списку викторин
              </Button>
            </div>
          </div>
        );
    }
  }, [
    contentType,
    error,
    quizId,
    router,
    activeQuiz,
    results,
    leaderboard,
    currentQuestion,
    remainingTime,
    submitLoading,
    hasSubmittedCurrentAnswer,
    correctOptionId,
    handleAnswer,
    handleSkipQuestion,
    quizStatus
  ]);
  
  // Определение класса для индикатора состояния соединения
  const connectionStatusClass = useMemo(() => {
    return isConnected 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }, [isConnected]);

  const connectionDotClass = useMemo(() => {
    return isConnected 
      ? 'bg-green-600' 
      : 'bg-red-600';
  }, [isConnected]);
  
  return (
    <div>
      {/* Индикатор состояния WebSocket */}
      <div className={`mb-4 px-3 py-1 inline-flex items-center rounded-full text-xs font-medium ${connectionStatusClass}`}>
        <span className={`h-2 w-2 rounded-full ${connectionDotClass} mr-1.5`}></span>
        {isConnected ? 'Подключено' : 'Не подключено'}
      </div>
      
      {/* Основной контент */}
      {renderContent()}
    </div>
  );
};

export default ActiveQuiz; 