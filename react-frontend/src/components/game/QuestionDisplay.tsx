import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Button } from '../ui';
import type { Question } from '../../types/api';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
`;

const QuestionCounter = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
`;

const TimerContainer = styled.div<{ urgent?: boolean }>`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Timer = styled.div<{ urgent?: boolean }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme, urgent }) => urgent ? theme.colors.error : theme.colors.primary};
  background: ${({ theme, urgent }) => urgent ? `${theme.colors.error}10` : `${theme.colors.primary}10`};
  padding: 0.75rem 1.5rem;
  border-radius: 24px;
  border: 2px solid ${({ theme, urgent }) => urgent ? theme.colors.error : theme.colors.primary};
  min-width: 100px;
  text-align: center;
  
  ${({ urgent }) => urgent && `
    animation: ${pulse} 1s infinite;
  `}
`;

const ScoreDisplay = styled.div`
  text-align: right;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const QuestionSection = styled.div`
  margin-bottom: 2rem;
`;

const QuestionText = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const AnswersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const AnswerButton = styled(Button)<{ 
  selected?: boolean; 
  correct?: boolean; 
  incorrect?: boolean;
  disabled?: boolean;
}>`
  padding: 1.5rem;
  text-align: left;
  height: auto;
  min-height: 4rem;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
  
  ${({ selected, theme }) => selected && `
    border: 2px solid ${theme.colors.primary};
    background: ${theme.colors.primary}20;
  `}
  
  ${({ correct, theme }) => correct && `
    background: ${theme.colors.success};
    border-color: ${theme.colors.success};
    color: white;
    
    &:hover {
      background: ${theme.colors.success};
    }
  `}
  
  ${({ incorrect, theme }) => incorrect && `
    background: ${theme.colors.error};
    border-color: ${theme.colors.error};
    color: white;
    
    &:hover {
      background: ${theme.colors.error};
    }
  `}
  
  &:disabled {
    cursor: default;
  }
`;

const AnswerPrefix = styled.span`
  font-weight: 700;
  margin-right: 0.75rem;
  opacity: 0.7;
`;

const ActionSection = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const StatusMessage = styled.div<{ type?: 'waiting' | 'answered' | 'timeout' }>`
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 500;
  
  ${({ type, theme }) => {
    switch (type) {
      case 'answered':
        return `
          background: ${theme.colors.success}10;
          color: ${theme.colors.success};
          border: 1px solid ${theme.colors.success}30;
        `;
      case 'timeout':
        return `
          background: ${theme.colors.warning}10;
          color: ${theme.colors.warning};
          border: 1px solid ${theme.colors.warning}30;
        `;
      default:
        return `
          background: ${theme.colors.primary}10;
          color: ${theme.colors.primary};
          border: 1px solid ${theme.colors.primary}30;
        `;
    }
  }}
`;

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining?: number;
  totalTime?: number;
  selectedAnswer?: number;
  hasAnswered?: boolean;
  showResults?: boolean;
  correctAnswer?: number;
  currentScore?: number;
  onAnswerSelect?: (answerIndex: number) => void;
  onSubmitAnswer?: () => void;
  onNextQuestion?: () => void;
  disabled?: boolean;
}

const ANSWER_PREFIXES = ['A', 'B', 'C', 'D', 'E', 'F'];

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  totalTime = 30,
  selectedAnswer,
  hasAnswered = false,
  showResults = false,
  correctAnswer,
  currentScore = 0,
  onAnswerSelect,
  onSubmitAnswer,
  onNextQuestion,
  disabled = false,
}) => {
  const [timeLeft, setTimeLeft] = useState(timeRemaining || totalTime);
  const isUrgent = timeLeft <= 10;
  const canSubmit = selectedAnswer !== undefined && !hasAnswered && !disabled;

  useEffect(() => {
    if (timeRemaining !== undefined) {
      setTimeLeft(timeRemaining);
    }
  }, [timeRemaining]);

  const handleAnswerClick = (answerIndex: number) => {
    if (disabled || hasAnswered || showResults) return;
    onAnswerSelect?.(answerIndex);
  };

  const getAnswerButtonProps = (answerIndex: number) => {
    const isSelected = selectedAnswer === answerIndex;
    
    if (showResults && correctAnswer !== undefined) {
      const isCorrect = answerIndex === correctAnswer;
      const isSelectedWrong = isSelected && !isCorrect;
      
      return {
        selected: isSelected && !showResults,
        correct: isCorrect,
        incorrect: isSelectedWrong,
        disabled: true,
      };
    }
    
    return {
      selected: isSelected,
      disabled: disabled || hasAnswered,
    };
  };

  const getStatusMessage = () => {
    if (showResults) {
      if (selectedAnswer === correctAnswer) {
        return { type: 'answered' as const, message: '🎉 Correct! Well done!' };
      } else if (selectedAnswer !== undefined) {
        return { type: 'timeout' as const, message: '❌ Incorrect. Better luck next time!' };
      } else {
        return { type: 'timeout' as const, message: '⏰ Time\'s up! No answer submitted.' };
      }
    } else if (hasAnswered) {
      return { type: 'answered' as const, message: '✅ Answer submitted! Waiting for other players...' };
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <Container>
      <Header>
        <QuestionCounter>
          Question {questionNumber} of {totalQuestions}
        </QuestionCounter>
        
        <TimerContainer>
          <Timer urgent={isUrgent}>
            {Math.max(0, Math.ceil(timeLeft))}s
          </Timer>
        </TimerContainer>
        
        <ScoreDisplay>
          Score: {currentScore}
        </ScoreDisplay>
      </Header>

      <QuestionSection>
        <QuestionText>
          {question.question}
        </QuestionText>

        <AnswersGrid>
          {question.answers.map((answer, index) => (
            <AnswerButton
              key={index}
              onClick={() => handleAnswerClick(index)}
              variant="outline"
              {...getAnswerButtonProps(index)}
            >
              <AnswerPrefix>{ANSWER_PREFIXES[index]})</AnswerPrefix>
              {answer}
            </AnswerButton>
          ))}
        </AnswersGrid>
      </QuestionSection>

      {statusMessage && (
        <StatusMessage type={statusMessage.type}>
          {statusMessage.message}
        </StatusMessage>
      )}

      <ActionSection>
        {canSubmit && onSubmitAnswer && (
          <Button 
            onClick={onSubmitAnswer}
            size="large"
            variant="primary"
          >
            Submit Answer
          </Button>
        )}
        
        {showResults && onNextQuestion && (
          <Button 
            onClick={onNextQuestion}
            size="large"
            variant="primary"
          >
            Next Question
          </Button>
        )}
      </ActionSection>
    </Container>
  );
};

export default QuestionDisplay; 