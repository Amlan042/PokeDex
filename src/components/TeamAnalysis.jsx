// TeamAnalysis.jsx - Analyze team strengths and weaknesses
import React from 'react';
import { useTeam } from '../context/TeamContext';

const TypeBadge = ({ type, count }) => (
  <div className={`team-type-badge type-${type}`}>
    <span className="type-name">{type}</span>
    {count > 1 && <span className="type-count">×{count}</span>}
  </div>
);

const TeamAnalysis = () => {
  const { team, teamAnalysis } = useTeam();

  if (team.length === 0) {
    return (
      <div className="team-analysis empty">
        <h3>📊 Team Analysis</h3>
        <p>Add Pokémon to your team to see analysis.</p>
      </div>
    );
  }

  const {
    allTypes,
    weaknesses,
    resistances,
    immunities,
    uncoveredTypes,
  } = teamAnalysis;

  // Sort weaknesses by count (most common first)
  const sortedWeaknesses = Object.entries(weaknesses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const sortedResistances = Object.entries(resistances)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Calculate team score
  const calculateTeamScore = () => {
    const typeCount = allTypes.length;
    const weaknessCount = Object.keys(weaknesses).length;
    const resistanceCount = Object.keys(resistances).length;
    const immunityCount = immunities.length;
    const uncoveredCount = uncoveredTypes.length;

    // Simple scoring formula
    let score = 50;
    score += typeCount * 5; // Diversity bonus
    score += resistanceCount * 2;
    score += immunityCount * 5;
    score -= weaknessCount * 1.5;
    score -= uncoveredCount * 2;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const teamScore = calculateTeamScore();

  const getScoreColor = (score) => {
    if (score >= 80) return '#1dd1a1';
    if (score >= 60) return '#48dbfb';
    if (score >= 40) return '#feca57';
    return '#ff6b6b';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="team-analysis">
      <h3>📊 Team Analysis</h3>
      
      {/* Team Score */}
      <div className="team-score-section">
        <div className="team-score" style={{ '--score-color': getScoreColor(teamScore) }}>
          <div className="score-circle">
            <span className="score-value">{teamScore}</span>
            <span className="score-label">{getScoreLabel(teamScore)}</span>
          </div>
        </div>
        <p className="score-description">
          Team Balance Score based on type coverage, weaknesses, and resistances.
        </p>
      </div>

      {/* Types in Team */}
      <div className="analysis-group">
        <h4>🎨 Team Types ({allTypes.length})</h4>
        <div className="type-badges">
          {allTypes.map(type => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>

      {/* Shared Weaknesses */}
      {sortedWeaknesses.length > 0 && (
        <div className="analysis-group weaknesses">
          <h4>⚠️ Team Weaknesses</h4>
          <p className="analysis-hint">Types that multiple team members are weak to:</p>
          <div className="type-badges">
            {sortedWeaknesses.map(([type, count]) => (
              <TypeBadge key={type} type={type} count={count} />
            ))}
          </div>
        </div>
      )}

      {/* Shared Resistances */}
      {sortedResistances.length > 0 && (
        <div className="analysis-group resistances">
          <h4>🛡️ Team Resistances</h4>
          <p className="analysis-hint">Types that team members resist:</p>
          <div className="type-badges">
            {sortedResistances.map(([type, count]) => (
              <TypeBadge key={type} type={type} count={count} />
            ))}
          </div>
        </div>
      )}

      {/* Immunities */}
      {immunities.length > 0 && (
        <div className="analysis-group immunities">
          <h4>✨ Team Immunities</h4>
          <div className="type-badges">
            {immunities.map(type => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      )}

      {/* Coverage Gaps */}
      {uncoveredTypes.length > 0 && (
        <div className="analysis-group coverage-gaps">
          <h4>🎯 Coverage Gaps</h4>
          <p className="analysis-hint">Types your team has no super effective moves against:</p>
          <div className="type-badges">
            {uncoveredTypes.map(type => (
              <TypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="analysis-recommendations">
        <h4>💡 Recommendations</h4>
        <ul>
          {team.length < 6 && (
            <li>Add more Pokémon to complete your team ({6 - team.length} slots remaining)</li>
          )}
          {sortedWeaknesses.filter(([, count]) => count >= 3).length > 0 && (
            <li>Consider replacing a Pokémon to reduce shared weaknesses</li>
          )}
          {uncoveredTypes.length > 5 && (
            <li>Your team lacks offensive coverage against many types</li>
          )}
          {allTypes.length < 4 && team.length >= 3 && (
            <li>Add more type diversity to your team</li>
          )}
          {allTypes.length >= 6 && team.length === 6 && sortedWeaknesses.filter(([, count]) => count >= 3).length === 0 && (
            <li>Great job! Your team has excellent type diversity</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default TeamAnalysis;
