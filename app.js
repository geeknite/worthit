/**
 * Is It Worth Finishing? - Decision Engine
 * ==========================================
 * A deterministic, explainable algorithm for game completion decisions.
 * 
 * ALGORITHM OVERVIEW:
 * ------------------
 * The algorithm calculates a "Worth Score" from 0-100 based on weighted factors.
 * 
 * Base Score: Enjoyment level (1-10) × 10 = 10-100 base points
 * 
 * Modifiers:
 * - Time Investment Ratio: Adjusts based on hours played vs remaining
 * - Backlog Pressure: Reduces score based on waiting games
 * - Completionist Mode: Adds bonus points for those who need closure
 * 
 * Thresholds:
 * - Score >= 65: FINISH
 * - Score 35-64: PAUSE
 * - Score < 35: ABANDON
 * 
 * Copyright 2026 worthit.geeknite.com - All Rights Reserved
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================
    const CONFIG = {
        thresholds: {
            finish: 65,
            pause: 35
        },
        weights: {
            baseEnjoyment: 10,           // Enjoyment × this = base score
            backlogPenaltyMax: 25,       // Max penalty from backlog
            timeInvestmentBonus: 10,     // Max bonus for sunk time
            completionistBonus: 15,      // Bonus for completionist mode
            remainingTimepenalty: 15     // Max penalty for long remaining time
        }
    };

    // ========================================
    // DOM ELEMENTS
    // ========================================
    const DOM = {
        hoursPlayed: document.getElementById('hoursPlayed'),
        hoursRemaining: document.getElementById('hoursRemaining'),
        enjoyment: document.getElementById('enjoyment'),
        enjoymentValue: document.getElementById('enjoymentValue'),
        backlog: document.getElementById('backlog'),
        backlogValue: document.getElementById('backlogValue'),
        completionist: document.getElementById('completionist'),
        calculateBtn: document.getElementById('calculateBtn'),
        resetBtn: document.getElementById('resetBtn'),
        resultSection: document.getElementById('resultSection'),
        resultCard: document.getElementById('resultCard'),
        resultIcon: document.getElementById('resultIcon'),
        resultTitle: document.getElementById('resultTitle'),
        recommendation: document.getElementById('recommendation'),
        resultExplanation: document.getElementById('resultExplanation'),
        scoreItems: document.getElementById('scoreItems'),
        finalScore: document.getElementById('finalScore')
    };

    // ========================================
    // ANTI-COPY PROTECTION
    // ========================================
    function initProtection() {
        // Disable right-click context menu
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });

        // Disable text selection on body
        document.body.classList.add('no-select');

        // Disable common keyboard shortcuts for copying/viewing source
        document.addEventListener('keydown', function(e) {
            // Ctrl+U (View Source), Ctrl+S (Save), Ctrl+Shift+I (DevTools)
            if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+I, Ctrl+Shift+J (DevTools)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
                e.preventDefault();
                return false;
            }
            // F12 (DevTools)
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
        });

        // Disable drag and drop
        document.addEventListener('dragstart', function(e) {
            e.preventDefault();
            return false;
        });

        // Console warning
        console.log('%c⚠️ Stop!', 'color: #ef4444; font-size: 40px; font-weight: bold;');
        console.log('%cThis is a browser feature intended for developers.', 'font-size: 16px;');
        console.log('%c© worthit.geeknite.com - All Rights Reserved', 'color: #6366f1; font-size: 14px;');
    }

    // ========================================
    // SLIDER HANDLERS
    // ========================================
    function initSliders() {
        DOM.enjoyment.addEventListener('input', function() {
            DOM.enjoymentValue.textContent = this.value;
        });

        DOM.backlog.addEventListener('input', function() {
            DOM.backlogValue.textContent = this.value;
        });
    }

    // ========================================
    // INPUT VALIDATION
    // ========================================
    function validateInputs() {
        let isValid = true;
        const errors = [];

        // Reset error states
        document.querySelectorAll('.input-group').forEach(group => {
            group.classList.remove('error');
        });

        const hoursPlayed = parseFloat(DOM.hoursPlayed.value);
        const hoursRemaining = parseFloat(DOM.hoursRemaining.value);

        if (isNaN(hoursPlayed) || hoursPlayed < 0) {
            DOM.hoursPlayed.closest('.input-group').classList.add('error');
            errors.push('Please enter valid hours played');
            isValid = false;
        }

        if (isNaN(hoursRemaining) || hoursRemaining < 0) {
            DOM.hoursRemaining.closest('.input-group').classList.add('error');
            errors.push('Please enter valid hours remaining');
            isValid = false;
        }

        return { isValid, errors };
    }

    // ========================================
    // DECISION ALGORITHM
    // ========================================
    function calculateDecision(inputs) {
        const { hoursPlayed, hoursRemaining, enjoyment, backlog, completionist } = inputs;
        const breakdown = [];
        
        // 1. BASE SCORE: Enjoyment level (10-100)
        const baseScore = enjoyment * CONFIG.weights.baseEnjoyment;
        breakdown.push({
            label: 'Base enjoyment score',
            value: baseScore,
            calculation: `${enjoyment} × ${CONFIG.weights.baseEnjoyment}`
        });

        // 2. TIME INVESTMENT MODIFIER
        // If you've invested significant time, slight bonus (sunk cost awareness)
        // If remaining time is huge compared to played, slight penalty
        let timeModifier = 0;
        const totalTime = hoursPlayed + hoursRemaining;
        
        if (totalTime > 0) {
            const investmentRatio = hoursPlayed / totalTime;
            // More time invested = small bonus (up to +10)
            timeModifier = Math.round((investmentRatio - 0.5) * CONFIG.weights.timeInvestmentBonus * 2);
            
            breakdown.push({
                label: 'Time investment modifier',
                value: timeModifier,
                calculation: `${Math.round(investmentRatio * 100)}% invested`
            });
        }

        // 3. REMAINING TIME PENALTY
        // Long remaining time with low enjoyment = bigger penalty
        let remainingPenalty = 0;
        if (hoursRemaining > 20 && enjoyment < 6) {
            // Scale penalty: more hours remaining + lower enjoyment = higher penalty
            const hoursFactor = Math.min(hoursRemaining / 50, 1); // Max out at 50 hours
            const enjoymentFactor = (6 - enjoyment) / 5; // Higher when enjoyment is lower
            remainingPenalty = -Math.round(hoursFactor * enjoymentFactor * CONFIG.weights.remainingTimepenalty);
            
            breakdown.push({
                label: 'Long remaining time penalty',
                value: remainingPenalty,
                calculation: `${hoursRemaining}hrs left, enjoyment ${enjoyment}/10`
            });
        }

        // 4. BACKLOG PRESSURE PENALTY
        // Higher backlog = more pressure to move on
        // Scale: backlog 1 = no penalty, backlog 10 = max penalty
        const backlogPenalty = -Math.round(((backlog - 1) / 9) * CONFIG.weights.backlogPenaltyMax);
        breakdown.push({
            label: 'Backlog pressure penalty',
            value: backlogPenalty,
            calculation: `Pressure level: ${backlog}/10`
        });

        // 5. COMPLETIONIST BONUS
        let completionistBonus = 0;
        if (completionist) {
            completionistBonus = CONFIG.weights.completionistBonus;
            breakdown.push({
                label: 'Completionist bonus',
                value: completionistBonus,
                calculation: 'Enabled'
            });
        }

        // CALCULATE FINAL SCORE
        let finalScore = baseScore + timeModifier + remainingPenalty + backlogPenalty + completionistBonus;
        
        // Clamp score between 0 and 100
        finalScore = Math.max(0, Math.min(100, finalScore));

        // DETERMINE RECOMMENDATION
        let recommendation, icon, explanation;
        
        if (finalScore >= CONFIG.thresholds.finish) {
            recommendation = 'FINISH';
            icon = '✅';
            explanation = generateFinishExplanation(inputs, finalScore);
        } else if (finalScore >= CONFIG.thresholds.pause) {
            recommendation = 'PAUSE';
            icon = '⏸️';
            explanation = generatePauseExplanation(inputs, finalScore);
        } else {
            recommendation = 'ABANDON';
            icon = '🚪';
            explanation = generateAbandonExplanation(inputs, finalScore);
        }

        return {
            score: Math.round(finalScore),
            recommendation,
            icon,
            explanation,
            breakdown
        };
    }

    // ========================================
    // EXPLANATION GENERATORS
    // ========================================
    function generateFinishExplanation(inputs, score) {
        const { enjoyment, hoursRemaining, hoursPlayed, completionist } = inputs;
        const explanations = [];

        if (enjoyment >= 8) {
            explanations.push(`You're having a great time (${enjoyment}/10 enjoyment).`);
        } else if (enjoyment >= 6) {
            explanations.push(`You're enjoying this reasonably well (${enjoyment}/10).`);
        }

        if (hoursPlayed > hoursRemaining) {
            explanations.push(`You're past the halfway point — the finish line is closer than the start.`);
        }

        if (completionist) {
            explanations.push(`As a completionist, you'll appreciate the closure.`);
        }

        if (hoursRemaining <= 5) {
            explanations.push(`With only ~${hoursRemaining} hours left, you're almost there.`);
        }

        explanations.push(`Finishing this game will likely feel rewarding.`);

        return explanations.join(' ');
    }

    function generatePauseExplanation(inputs, score) {
        const { enjoyment, hoursRemaining, backlog } = inputs;
        const explanations = [];

        explanations.push(`Your situation is balanced — neither strongly for nor against finishing.`);

        if (enjoyment >= 5 && enjoyment <= 7) {
            explanations.push(`You're having an okay time, but nothing exceptional.`);
        }

        if (backlog >= 5) {
            explanations.push(`Your backlog is calling, but this game isn't a lost cause.`);
        }

        if (hoursRemaining > 15) {
            explanations.push(`There's still significant time investment ahead.`);
        }

        explanations.push(`Consider taking a break and revisiting later — you might return with fresh enthusiasm, or realize you don't miss it.`);

        return explanations.join(' ');
    }

    function generateAbandonExplanation(inputs, score) {
        const { enjoyment, hoursRemaining, backlog, hoursPlayed } = inputs;
        const explanations = [];

        if (enjoyment <= 4) {
            explanations.push(`With enjoyment at ${enjoyment}/10, you're not having much fun.`);
        }

        if (hoursRemaining > 20) {
            explanations.push(`There are still ${hoursRemaining}+ hours ahead — that's a lot of time for something you're not enjoying.`);
        }

        if (backlog >= 7) {
            explanations.push(`Your backlog is substantial, and there are probably games you'd enjoy more.`);
        }

        if (hoursPlayed > 0) {
            explanations.push(`The ${hoursPlayed} hours you've played aren't wasted — they taught you what you don't want.`);
        }

        explanations.push(`Life's too short for mediocre games. Move on without guilt.`);

        return explanations.join(' ');
    }

    // ========================================
    // DISPLAY RESULTS
    // ========================================
    function displayResults(result) {
        // Update recommendation text
        DOM.recommendation.textContent = result.recommendation;
        DOM.recommendation.className = 'recommendation ' + result.recommendation.toLowerCase();

        // Update icon
        DOM.resultIcon.textContent = result.icon;

        // Update explanation
        DOM.resultExplanation.textContent = result.explanation;

        // Update card styling
        DOM.resultCard.className = 'result-card ' + result.recommendation.toLowerCase();

        // Build score breakdown
        DOM.scoreItems.innerHTML = result.breakdown.map(item => `
            <div class="score-item">
                <span class="score-item-label">${item.label}</span>
                <span class="score-item-value ${item.value >= 0 ? (item.value > 0 ? 'positive' : 'neutral') : 'negative'}">
                    ${item.value >= 0 ? '+' : ''}${item.value}
                </span>
            </div>
        `).join('');

        // Update final score
        DOM.finalScore.textContent = result.score;

        // Show result section
        DOM.resultSection.classList.remove('hidden');

        // Scroll to results
        DOM.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ========================================
    // EVENT HANDLERS
    // ========================================
    function handleCalculate() {
        const validation = validateInputs();
        
        if (!validation.isValid) {
            return;
        }

        const inputs = {
            hoursPlayed: parseFloat(DOM.hoursPlayed.value) || 0,
            hoursRemaining: parseFloat(DOM.hoursRemaining.value) || 0,
            enjoyment: parseInt(DOM.enjoyment.value, 10),
            backlog: parseInt(DOM.backlog.value, 10),
            completionist: DOM.completionist.checked
        };

        const result = calculateDecision(inputs);
        displayResults(result);

        // Analytics placeholder (ready for Google Analytics, Plausible, etc.)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculate_decision', {
                'event_category': 'engagement',
                'event_label': result.recommendation,
                'value': result.score
            });
        }
    }

    function handleReset() {
        // Reset form
        DOM.hoursPlayed.value = '';
        DOM.hoursRemaining.value = '';
        DOM.enjoyment.value = 5;
        DOM.enjoymentValue.textContent = '5';
        DOM.backlog.value = 5;
        DOM.backlogValue.textContent = '5';
        DOM.completionist.checked = false;

        // Clear error states
        document.querySelectorAll('.input-group').forEach(group => {
            group.classList.remove('error');
        });

        // Hide results
        DOM.resultSection.classList.add('hidden');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    function init() {
        initProtection();
        initSliders();

        DOM.calculateBtn.addEventListener('click', handleCalculate);
        DOM.resetBtn.addEventListener('click', handleReset);

        // Allow Enter key to trigger calculation
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleCalculate();
                }
            });
        });

        // Integrity check
        (function() {
            const marker = document.querySelector('.copyright');
            if (!marker || !marker.textContent.includes('worthit.geeknite.com')) {
                document.body.innerHTML = '<div style="padding:50px;text-align:center;"><h1>⚠️ Unauthorized Copy</h1><p>This application is licensed to worthit.geeknite.com</p></div>';
            }
        })();
    }

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
