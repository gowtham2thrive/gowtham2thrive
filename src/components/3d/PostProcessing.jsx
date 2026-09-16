import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import useStore from '../../store/useStore';

const CHROMATIC_OFFSET = new Vector2(0.0006, 0.0006);

export default function PostProcessingEffects() {
  const deviceTier = useStore((s) => s.deviceTier);

  // Low tier: skip post-processing entirely
  if (deviceTier === 'low') {
    return null;
  }

  // Medium tier: enhanced bloom + vignette
  if (deviceTier === 'medium') {
    return (
      <EffectComposer key="composer-medium" multisampling={0}>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <Vignette
          offset={0.35}
          darkness={0.55}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    );
  }

  // High tier: full premium effect stack with zero-bandwidth MSAA overhead
  return (
    <EffectComposer key="composer-full" multisampling={0}>
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.65}
        luminanceSmoothing={0.25}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.6}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={CHROMATIC_OFFSET}
        blendFunction={BlendFunction.NORMAL}
        radialModulation
        modulationOffset={0.5}
      />
    </EffectComposer>
  );
}
