import { Component, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  imports: [],
  template: `
    <div class="avatar" [style.background]="color()" [style.width.px]="size()" [style.height.px]="size()"
         [style.font-size.px]="size() * 0.42">
      {{ initials() }}
    </div>
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      user-select: none;
      flex-shrink: 0;
      border: 2px solid rgba(255,255,255,.15);
    }
  `],
})
export class AvatarComponent {
  name = input.required<string>();
  color = input.required<string>();
  size = input(40);

  initials(): string {
    const parts = this.name().trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '?';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + second).toUpperCase();
  }
}
