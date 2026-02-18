import React from 'react';
import './CategorySelector.css';

const CATEGORIES = [
    { id: 'mechanic', label: 'Mechanic', icon: '🔧', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'paint', label: 'Paint', icon: '🎨', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'running', label: 'Running', icon: '🏍️', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'from-final', label: 'From Final', icon: '💬', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'dyno', label: 'Dyno', icon: '⚡', gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' }
];

const CategorySelector = ({ vin, onCategorySelect }) => {
    return (
        <div className="category-container glass-card">
            <div className="category-header">
                <h2>Select Category</h2>
                <div className="vin-display">
                    <span className="vin-label">VIN:</span>
                    <span className="vin-value">{vin}</span>
                </div>
            </div>

            <div className="category-grid">
                {CATEGORIES.map((category) => (
                    <button
                        key={category.id}
                        className="category-card"
                        style={{ background: category.gradient }}
                        onClick={() => onCategorySelect(category.label)}
                    >
                        <div className="category-icon">{category.icon}</div>
                        <div className="category-label">{category.label}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategorySelector;
