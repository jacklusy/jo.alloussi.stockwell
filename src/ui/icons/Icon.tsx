import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'inventory'
  | 'sync'
  | 'settings'
  | 'warning'
  | 'offline'
  | 'empty'
  | 'error'
  | 'permission'
  | 'check'
  | 'pending'
  | 'conflict'
  | 'failed'
  | 'scan'
  | 'chevronRight'
  | 'torch';

export type IconProps = {
  name: IconName;
  size?: number;
  color: string;
  testID?: string;
};

/**
 * Lightweight SVG icon set — colour is never the sole carrier of meaning.
 */
export function Icon({ name, size = 24, color, testID }: IconProps): React.JSX.Element {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    ...(testID !== undefined ? { testID } : {}),
  };

  switch (name) {
    case 'inventory':
      return (
        <Svg {...common}>
          <Path
            d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"
            stroke={color}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          <Path d="M12 12v9M3 7.5 12 12l9-4.5" stroke={color} strokeWidth={1.75} />
        </Svg>
      );
    case 'sync':
      return (
        <Svg {...common}>
          <Path
            d="M4 12a8 8 0 0 1 13.5-5.8M20 12a8 8 0 0 1-13.5 5.8"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Path
            d="M17 3v4h4M7 21v-4H3"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'settings':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.75} />
          <Path
            d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'warning':
    case 'conflict':
      return (
        <Svg {...common}>
          <Path
            d="M12 4 3.5 19h17L12 4Z"
            stroke={color}
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          <Path d="M12 10v4.5" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
          <Circle cx={12} cy={17} r={0.9} fill={color} />
        </Svg>
      );
    case 'offline':
      return (
        <Svg {...common}>
          <Path
            d="M2 8.5c3.5-3.2 8-4.5 12.5-3.8M5.5 12c2.5-2.2 5.6-3.2 8.8-3"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Path
            d="M9 15.5a5 5 0 0 1 4.2-1.2"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Circle cx={12} cy={19} r={1.1} fill={color} />
          <Path d="M4 4l16 16" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
        </Svg>
      );
    case 'empty':
      return (
        <Svg {...common}>
          <Rect x={5} y={6} width={14} height={12} rx={2} stroke={color} strokeWidth={1.75} />
          <Path d="M9 11h6M9 14h4" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
        </Svg>
      );
    case 'error':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={8.25} stroke={color} strokeWidth={1.75} />
          <Path d="M12 8v5" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
          <Circle cx={12} cy={16} r={1} fill={color} />
        </Svg>
      );
    case 'permission':
      return (
        <Svg {...common}>
          <Path
            d="M8 11V8a4 4 0 1 1 8 0v3"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          <Rect x={6} y={11} width={12} height={9} rx={2} stroke={color} strokeWidth={1.75} />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={8.25} stroke={color} strokeWidth={1.75} />
          <Path
            d="M8 12.5 10.8 15.2 16 9.5"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'pending':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={8.25} stroke={color} strokeWidth={1.75} />
          <Path d="M12 7.5v5l3 2" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
        </Svg>
      );
    case 'failed':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={8.25} stroke={color} strokeWidth={1.75} />
          <Path d="M9 9l6 6M15 9l-6 6" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
        </Svg>
      );
    case 'scan':
      return (
        <Svg {...common}>
          <Path
            d="M6 8V6h2M16 6h2v2M18 16v2h-2M8 18H6v-2"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M8 12h8" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
        </Svg>
      );
    case 'chevronRight':
      return (
        <Svg {...common}>
          <Path
            d="M9 6l6 6-6 6"
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'torch':
      return (
        <Svg {...common}>
          <Path d="M9 3h6l1 4H8l1-4Z" stroke={color} strokeWidth={1.75} strokeLinejoin="round" />
          <Path d="M10 7v10a2 2 0 0 0 4 0V7" stroke={color} strokeWidth={1.75} />
        </Svg>
      );
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
