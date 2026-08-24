import { describe, it, expect } from 'vitest';
import { evaluateMathExpression } from '@/utils/smartCalc';

describe('evaluateMathExpression', () => {
  it('returns the value as-is for null/undefined/empty', () => {
    expect(evaluateMathExpression(null)).toBe(null);
    expect(evaluateMathExpression(undefined)).toBe(undefined);
    expect(evaluateMathExpression('')).toBe('');
  });

  it('returns numbers as-is', () => {
    expect(evaluateMathExpression(42)).toBe(42);
    expect(evaluateMathExpression(0)).toBe(0);
    expect(evaluateMathExpression(-5)).toBe(-5);
  });

  it('evaluates simple arithmetic', () => {
    expect(evaluateMathExpression('2+3')).toBe(5);
    expect(evaluateMathExpression('10-4')).toBe(6);
    expect(evaluateMathExpression('3*4')).toBe(12);
    expect(evaluateMathExpression('10/2')).toBe(5);
  });

  it('handles decimal numbers', () => {
    expect(evaluateMathExpression('3.5+1.5')).toBe(5);
  });

  it('handles Turkish comma as decimal separator', () => {
    expect(evaluateMathExpression('3,5+1,5')).toBe(5);
  });

  it('handles parentheses', () => {
    expect(evaluateMathExpression('(2+3)*4')).toBe(20);
  });

  it('rounds to 4 decimal places', () => {
    expect(evaluateMathExpression('10/3')).toBe(3.3333);
  });

  it('handles thousand separators with comma decimal', () => {
    expect(evaluateMathExpression('1.250,50+50')).toBe(1300.5);
    expect(evaluateMathExpression('1.500*2')).toBe(3000);
    expect(evaluateMathExpression('1.000.000+500')).toBe(1000500);
    expect(evaluateMathExpression('1,000,000.50+0.50')).toBe(1000001);
  });

  it('returns original value for non-math expressions', () => {
    expect(evaluateMathExpression('hello')).toBe('hello');
    expect(evaluateMathExpression('abc+123')).toBe('abc+123');
  });
});
