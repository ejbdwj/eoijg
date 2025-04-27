declare module 'react-qr-scanner' {
  import { Component } from 'react';

  interface VideoConstraints {
    facingMode?: string;
    width?: number;
    height?: number;
    frameRate?: number;
    [key: string]: any;
  }

  export interface QrReaderProps {
    delay?: number | false;
    facingMode?: string;
    resolution?: number;
    onError?: (error: Error) => void;
    onScan?: (data: { text: string } | null) => void;
    style?: object;
    className?: string;
    constraints?: {
      audio?: boolean;
      video?: boolean | VideoConstraints;
    };
    chooseDeviceId?: () => Promise<string>;
    legacyMode?: boolean;
  }

  export default class QrReader extends Component<QrReaderProps> {}
} 