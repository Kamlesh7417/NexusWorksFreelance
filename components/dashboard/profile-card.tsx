'use client';

import { useState } from 'react';
import { ProfileModal } from '@/components/modals/profile-modal';

export function ProfileCard() {
  const [showModal, setShowModal] = useState(false);

  const profiles = [
    {
      name: "Alexandra Reed",
      skills: "Quantum Dev, AI, Blockchain",
      rating: "★★★★★ 4.9"
    },
    {
      name: "Marcus Tan", 
      skills: "UX Design, AR/VR, Branding",
      rating: "★★★★☆ 4.7"
    },
    {
      name: "Sofia Mendes",
      skills: "Data Science, ML, Python", 
      rating: "★★★★★ 5.0"
    },
    {
      name: "James Okoro",
      skills: "Cybersecurity, Encryption",
      rating: "★★★★☆ 4.8"
    }
  ];

  return (
    <>
      <div className="nexus-card">
        <h2>Dynamic Profile</h2>
        <div className="bg-cyan-500/10 border border-cyan-500/30 text-white px-4 py-2 rounded-full text-sm text-center mb-4">
          Neural Compatibility: <span>Connected</span>
        </div>
        <p>Showcase your work in interactive 3D holograms.</p>
        <div className="nexus-hologram">
          Your 3D Portfolio<br />[Holographic Projection]
        </div>
        <div className="nexus-profile-list">
          {profiles.map((profile, index) => (
            <div key={index} className="nexus-profile-item">
              <div className="nexus-profile-details">
                <div className="nexus-profile-name">{profile.name}</div>
                <div className="nexus-profile-skills">{profile.skills}</div>
              </div>
              <div className="nexus-profile-rating">{profile.rating}</div>
            </div>
          ))}
        </div>
        <button className="nexus-action-btn" onClick={() => setShowModal(true)}>
          View Portfolio
        </button>
      </div>

      <ProfileModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}