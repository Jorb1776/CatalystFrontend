declare module 'qrcode.react' {
  import { Component } from 'react';

  export interface QRCodeProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    bgColor?: string;
    fgColor?: string;
    includeMargin?: boolean;
  }

  export class QRCodeSVG extends Component<QRCodeProps> {}
  export class QRCodeCanvas extends Component<QRCodeProps> {}
}
