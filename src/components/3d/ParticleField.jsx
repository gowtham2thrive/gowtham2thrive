import { Stars } from '@react-three/drei';
import useStore from '../../store/useStore';

export default function ParticleField() {
  const deviceTier = useStore((s) => s.deviceTier);
  const count = deviceTier === 'low' ? 600 : deviceTier === 'medium' ? 1500 : 2600;

  return (
    <Stars
      radius={90}
      depth={50}
      count={count}
      factor={3.2}
      saturation={0.1}
      fade
      speed={0}
    />
  );
}
