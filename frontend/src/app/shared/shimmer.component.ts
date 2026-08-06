import { Component, input } from '@angular/core';

@Component({
  selector: 'app-shimmer',
  imports: [],
  template: `
    <div class="shimmer" [class]="type()">
      @switch (type()) {
        @case ('feed') {
          @for (i of range(); track i) {
            <div class="sk sk-post">
              <div class="sk-row">
                <div class="sk-avatar"></div>
                <div class="sk-lines">
                  <div class="sk-line w-60"></div>
                  <div class="sk-line w-40"></div>
                </div>
              </div>
              <div class="sk-line w-100"></div>
              <div class="sk-line w-85"></div>
              <div class="sk-block sk-img"></div>
              <div class="sk-row sk-actions">
                <div class="sk-chip"></div>
                <div class="sk-chip"></div>
                <div class="sk-chip"></div>
                <div class="sk-chip"></div>
              </div>
            </div>
          }
        }
        @case ('list') {
          @for (i of range(); track i) {
            <div class="sk sk-list">
              <div class="sk-avatar"></div>
              <div class="sk-lines">
                <div class="sk-line w-60"></div>
                <div class="sk-line w-40"></div>
              </div>
            </div>
          }
        }
        @case ('bubbles') {
          @for (i of range(); track i) {
            <div class="sk-bubble-row" [class.mine]="i % 2 === 1">
              <div class="sk-bubble"></div>
            </div>
          }
        }
        @case ('reels') {
          @for (i of range(); track i) {
            <div class="sk sk-reel"></div>
          }
        }
        @case ('users') {
          @for (i of range(); track i) {
            <div class="sk sk-user">
              <div class="sk-avatar lg"></div>
              <div class="sk-line w-70"></div>
              <div class="sk-line w-50"></div>
              <div class="sk-chip center"></div>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .shimmer { display: flex; flex-direction: column; gap: 16px; }

    .sk-avatar, .sk-line, .sk-block, .sk-chip, .sk-bubble, .sk-reel {
      background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite linear;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .sk { border: 1px solid var(--border); border-radius: var(--radius); }

    .sk-post { padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
    .sk-list { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 14px; }
    .sk-user { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px; text-align: center; }

    .sk-row { display: flex; align-items: center; gap: 12px; }
    .sk-actions { margin-top: 2px; justify-content: space-between; }
    .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }

    .sk-avatar { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; }
    .sk-avatar.lg { width: 56px; height: 56px; }

    .sk-line { height: 13px; border-radius: 8px; }
    .sk-line.w-100 { width: 100%; }
    .sk-line.w-85 { width: 85%; }
    .sk-line.w-70 { width: 70%; }
    .sk-line.w-60 { width: 60%; }
    .sk-line.w-50 { width: 50%; }
    .sk-line.w-40 { width: 40%; }

    .sk-img { height: 220px; border-radius: 12px; }
    .sk-chip { width: 42px; height: 26px; border-radius: 999px; }
    .sk-chip.center { margin-top: 4px; }

    .sk-bubble-row { display: flex; }
    .sk-bubble-row.mine { justify-content: flex-end; }
    .sk-bubble { width: 55%; height: 44px; border-radius: 16px; }

    .sk-reel { height: 60vh; min-height: 340px; border-radius: var(--radius); }
  `],
})
export class ShimmerComponent {
  type = input<'feed' | 'list' | 'bubbles' | 'reels' | 'users'>('feed');
  n = input(3);

  range(): number[] {
    return Array.from({ length: Math.max(1, this.n()) }, (_, i) => i);
  }
}
