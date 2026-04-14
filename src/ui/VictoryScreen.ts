import { RunSummary } from '../types';
import { RunSummaryOverlay } from './RunSummaryOverlay';

export class VictoryScreen extends RunSummaryOverlay {
  constructor(onRestart: () => void) {
    super('victory-screen', 'Play Again', onRestart);
  }

  public show(summary: RunSummary): void {
    super.show(summary, 'VICTORY');
  }
}
