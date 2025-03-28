import React, { useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { useActiveQuiz, useNextScheduledQuiz } from '../hooks/query-hooks/useQuizQueries';
import Button from '../components/common/Button';
import { Quiz } from '../types/quiz';

const Home: NextPage = () => {
  // Используем хук для получения активной викторины
  const { 
    data: activeQuiz, 
    isLoading: isLoadingActive, 
    error: activeError 
  } = useActiveQuiz();

  // Используем хук для получения ближайшей запланированной викторины
  const { 
    data: nextScheduledQuiz, 
    isLoading: isLoadingScheduled, 
    error: scheduledError 
  } = useNextScheduledQuiz();

  useEffect(() => {
    // Логирование для отладки
    console.log('Active quiz:', activeQuiz);
    console.log('Next scheduled quiz:', nextScheduledQuiz);
    
    if (activeError) console.error('Error loading active quiz:', activeError);
    if (scheduledError) console.error('Error loading scheduled quiz:', scheduledError);
  }, [activeQuiz, nextScheduledQuiz, activeError, scheduledError]);

  // Определяем, какую викторину показывать (активную или ближайшую запланированную)
  const isLoading = isLoadingActive || isLoadingScheduled;
  const quizToShow = activeQuiz || nextScheduledQuiz;
  const hasError = activeError || scheduledError;

  // Функция для форматирования времени начала викторины
  const formatQuizTime = (quiz: Quiz | null): string => {
    if (!quiz) return '';
    const timeString = quiz.startTime || quiz.scheduledTime || '';
    if (!timeString) return 'Время не указано';
    
    try {
      return new Date(timeString).toLocaleString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return timeString;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <Head>
          <title>Trivia API - Онлайн Викторины</title>
          <meta name="description" content="Платформа для участия в онлайн-викторинах в реальном времени" />
        </Head>

        <main className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            Добро пожаловать в Trivia API
          </h1>
          <p className="text-xl text-center mb-12">
            Платформа для участия в онлайн-викторинах в реальном времени
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Link href="/play" className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-2xl font-semibold mb-4">Играйте в викторину</h2>
              <p className="mb-4">Присоединяйтесь к активной викторине или ожидайте ближайшую запланированную и соревнуйтесь с другими участниками в реальном времени.</p>
              <div className="text-blue-600 font-medium">Перейти к игре →</div>
            </Link>
            
            <Link href="/results" className="bg-green-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-2xl font-semibold mb-4">Следите за результатами</h2>
              <p className="mb-4">Отслеживайте свой прогресс, лучшие результаты и положение в рейтинге.</p>
              <div className="text-green-600 font-medium">Смотреть результаты →</div>
            </Link>
          </div>
          
          {/* Текущая викторина (активная или ближайшая запланированная) */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">
              {activeQuiz ? "Активная викторина" : "Ближайшая викторина"}
            </h2>
            
            {isLoading ? (
              <p className="text-center text-gray-500">Загрузка данных...</p>
            ) : hasError ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">Ошибка при загрузке данных</p>
                <p className="text-sm text-gray-400">Пожалуйста, попробуйте обновить страницу</p>
              </div>
            ) : quizToShow ? (
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-xl">{quizToShow.title}</h3>
                  {activeQuiz ? (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">В процессе</span>
                  ) : (
                    <span className="text-blue-600">
                      {formatQuizTime(quizToShow)}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">{quizToShow.description}</p>
                
                <div className="mb-4 flex flex-wrap gap-2">
                  {quizToShow.questionCount && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {quizToShow.questionCount} вопросов
                    </span>
                  )}
                  
                  {quizToShow.durationMinutes && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {quizToShow.durationMinutes} минут
                    </span>
                  )}

                  {quizToShow.difficulty && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {quizToShow.difficulty === 'easy' ? 'Лёгкий' 
                        : quizToShow.difficulty === 'medium' ? 'Средний' 
                        : 'Сложный'}
                    </span>
                  )}
                </div>
                
                <div className="mt-6">
                  <Link href="/play">
                    <Button variant="primary" className="w-full">
                      {activeQuiz ? "Присоединиться сейчас" : "Ожидать викторину"}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">В данный момент нет активных или запланированных викторин</p>
                <p className="text-sm text-gray-400">Пожалуйста, загляните позже</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Home; 