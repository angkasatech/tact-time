import React from 'react';
import { Wrench, Paintbrush, Bike, Zap, MessageCircle } from 'lucide-react';
import './CategorySelector.css';

const CATEGORIES = [
    { id: 'mechanic',   label: 'Mechanic',   icon: <Wrench size={32} />,        bg: '#21C997', textColor: '#000' },
    { id: 'paint',      label: 'Paint',      icon: <Paintbrush size={32} />,    bg: '#55DAE6', textColor: '#000' },
    { id: 'running',    label: 'Running',    icon: <Bike size={32} />,          bg: '#1aab84', textColor: '#000' },
    { id: 'dyno',       label: 'Dyno',       icon: <Zap size={32} />,           bg: '#f0a500', textColor: '#000' },
    { id: 'from-final', label: 'From Final', icon: <MessageCircle size={32} />, bg: '#3d3d3d', textColor: '#fff' },
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
                        style={{ background: category.bg, color: category.textColor }}
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
