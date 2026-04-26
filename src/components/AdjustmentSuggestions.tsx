import React from 'react';
import { TrendingDown, TrendingUp, Minus, Lightbulb } from 'lucide-react';

interface AdjustmentSuggestionProps {
  currentCalories: number;
  suggestedCalories: number;
  currentProtein?: number;
  suggestedProtein?: number;
  reason: string;
}

export function AdjustmentSuggestions({
  currentCalories,
  suggestedCalories,
  currentProtein,
  suggestedProtein,
  reason,
}: AdjustmentSuggestionProps) {
  const calorieDifference = suggestedCalories - currentCalories;
  const proteinDifference = suggestedProtein ? suggestedProtein - (currentProtein || 0) : null;

  return (
    <div className="bg-gradient-to-br from-theme-accent/10 to-indigo-500/10 rounded-2xl p-6 border border-theme-accent/20">
      <div className="flex items-center space-x-2 mb-4">
        <Lightbulb className="w-5 h-5 text-theme-accent" />
        <h3 className="text-lg font-semibold text-theme-text-primary">
          Suggested Adjustments
        </h3>
      </div>

      <p className="text-sm text-theme-text-secondary mb-4">{reason}</p>

      <div className="space-y-3">
        {/* Calorie Adjustment */}
        <div className="glass card-hover rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-theme-text-tertiary">
              Daily Calories
            </span>
            <div className="flex items-center space-x-2">
              {calorieDifference > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : calorieDifference < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-theme-text-tertiary" />
              )}
              <span className={`text-sm font-semibold ${
                calorieDifference > 0 ? 'text-green-600' : 
                calorieDifference < 0 ? 'text-red-600' : 'text-theme-text-secondary'
              }`}>
                {calorieDifference > 0 ? '+' : ''}{calorieDifference} cal
              </span>
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-theme-text-primary">
              {suggestedCalories}
            </span>
            <span className="text-sm text-theme-text-tertiary line-through">
              {currentCalories}
            </span>
            <span className="text-xs text-theme-text-tertiary">cal/day</span>
          </div>
        </div>

        {/* Protein Adjustment */}
        {proteinDifference !== null && (
          <div className="glass card-hover rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-theme-text-tertiary">
                Daily Protein
              </span>
              <div className="flex items-center space-x-2">
                {proteinDifference > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : proteinDifference < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : (
                  <Minus className="w-4 h-4 text-theme-text-tertiary" />
                )}
                <span className={`text-sm font-semibold ${
                  proteinDifference > 0 ? 'text-green-600' : 
                  proteinDifference < 0 ? 'text-red-600' : 'text-theme-text-secondary'
                }`}>
                  {proteinDifference > 0 ? '+' : ''}{proteinDifference}g
                </span>
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-theme-text-primary">
                {suggestedProtein}
              </span>
              <span className="text-sm text-theme-text-tertiary line-through">
                {currentProtein}
              </span>
              <span className="text-xs text-theme-text-tertiary">g/day</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-theme-accent/10 rounded-lg">
        <p className="text-xs text-theme-text-primary">
          💡 <strong>Tip:</strong> Make gradual changes over 1-2 weeks to allow your body to adjust. 
          Track your progress and adjust further if needed.
        </p>
      </div>
    </div>
  );
}
