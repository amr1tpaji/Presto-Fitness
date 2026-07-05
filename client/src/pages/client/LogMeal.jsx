import React from 'react';
import { Sparkles } from 'lucide-react';
import MealLogger from '../../components/client/MealLogger';
import '../../styles/client.css';

export default function LogMeal() {
  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title flex gap-sm" style={{ alignItems: 'center' }}>
            <Sparkles size={28} className="text-accent" /> Log Your Meal
          </h1>
          <p className="page-subtitle">Track your nutrition and get instant feedback from Kitty!</p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <MealLogger />
      </div>
    </div>
  );
}
