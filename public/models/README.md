# 3D Character Models

This directory contains 3D character models for the NexusWorks platform.

## Required Models

1. **character-basic.glb** - Basic fallback character model
2. **business-character.glb** - Professional client guide character
3. **developer-character.glb** - Tech-focused developer guide character
4. **ai-character.glb** - Futuristic AI assistant character

## Model Requirements

- Format: GLTF/GLB (preferred) or FBX
- Polygon count: 5,000-15,000 triangles for optimal performance
- Texture resolution: 1024x1024 or 2048x2048
- Animation clips: idle, greeting, explaining, pointing, celebrating, thinking
- Rigging: Standard humanoid rig with facial bones for expressions

## Optimization

- Use Draco compression for smaller file sizes
- Include multiple LOD (Level of Detail) versions
- Optimize textures with proper compression
- Ensure models work well with Three.js/React Three Fiber

## Fallback System

If models are not available, the system will use procedural geometry as fallbacks.
The fallback characters are created using Three.js basic geometries with appropriate materials and animations.

## Asset Sources

You can create or obtain 3D characters from:
- Mixamo (Adobe) - Free rigged characters with animations
- Sketchfab - Marketplace for 3D models
- Ready Player Me - Avatar creation platform
- Custom modeling in Blender, Maya, or other 3D software

## Implementation Notes

- Models should be positioned at origin (0,0,0)
- Scale should be approximately 1 unit = 1 meter
- Forward direction should be positive Z-axis
- Animations should loop smoothly for idle states
- Include proper material setup for PBR rendering