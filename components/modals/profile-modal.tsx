'use client';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  if (!isOpen) return null;

  const profiles = [
    {
      name: "Alexandra Reed",
      skills: "Quantum Dev, AI, Blockchain | 12 Projects",
      rating: "★★★★★ 4.9 (32 reviews)",
      recent: "Recent: Quantum Trading Platform (2023)"
    },
    {
      name: "Marcus Tan",
      skills: "UX Design, AR/VR, Branding | 8 Projects", 
      rating: "★★★★☆ 4.7 (19 reviews)",
      recent: "Recent: AR Shopping App UI (2023)"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white/5 border border-white/20 rounded-2xl p-8 max-w-2xl w-[90%] max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-cyan-400 mb-4">3D Holographic Portfolio</h2>
        <p className="mb-4">Your work is displayed as interactive holograms. Clients can explore your projects in 360° with gesture controls.</p>
        <p className="mb-6 text-green-400">[Simulated BCI Connection Active]</p>
        
        <div className="nexus-profile-list">
          {profiles.map((profile, index) => (
            <div key={index} className="nexus-profile-item">
              <div className="nexus-profile-details">
                <div className="nexus-profile-name">{profile.name}</div>
                <div className="nexus-profile-skills">{profile.skills}</div>
                <div className="text-xs mt-1 opacity-80">{profile.recent}</div>
              </div>
              <div className="nexus-profile-rating">{profile.rating}</div>
            </div>
          ))}
        </div>
        
        <button className="nexus-back-btn mt-4" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}