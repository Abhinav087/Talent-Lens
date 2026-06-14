import { Check } from 'lucide-react';

export default function LoadingScreen({ activeStage, currentModelName }) {
  const stages = [
    { id: 0, text: "Extracting resume text" },
    { id: 1, text: currentModelName ? `Trying ${currentModelName}...` : "Calling OpenRouter API..." },
    { id: 2, text: "Scoring sections & skills" },
    { id: 3, text: "Building your report" }
  ];

  return (
    <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
      <div className="spinner" style={{ marginBottom: '32px' }}></div>
      
      <div className="stages-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '300px' }}>
        {stages.map((stage) => {
          const isCompleted = stage.id < activeStage;
          const isActive = stage.id === activeStage;
          
          let opacity = 0.4;
          let color = "var(--color-text-muted)";
          
          if (isActive) {
            opacity = 1;
            color = "var(--color-text-primary)";
          }

          return (
            <div 
              key={stage.id} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                opacity: opacity, 
                color: color,
                transition: 'all 0.3s ease'
              }}
            >
              <div 
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: isCompleted ? 'none' : `1.5px solid ${isActive ? '#534AB7' : 'var(--color-border-tertiary)'}`,
                  backgroundColor: isCompleted ? '#3B6D11' : 'transparent',
                  color: isCompleted ? '#ffffff' : 'transparent'
                }}
              >
                {isCompleted && <Check size={12} strokeWidth={3} />}
              </div>
              <span className="text-md font-medium" style={{ color: isActive ? 'var(--color-text-primary)' : 'inherit' }}>
                {stage.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
