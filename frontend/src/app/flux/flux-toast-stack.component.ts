import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FluxToastStack } from '../demo/ari/flux-toast-stack';
import type { FluxToast } from '../demo/ari/flux-toast-stack';

@Component({
  selector: 'flux-toast-stack',
  template: '<div class="flux-toast-host" #host></div>',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../demo/ari/flux-toast-stack.css', './flux-toast-stack.css'],
})
export class FluxToastStackComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;

  @Input() items: FluxToast[] = [];
  @Input() colors = ['#020617', '#a855f7', '#38bdf8'];
  @Output() dismiss = new EventEmitter<string>();

  private root?: Root;
  private ready = false;

  ngAfterViewInit(): void {
    this.ready = true;
    this.root = createRoot(this.host.nativeElement);
    this.render();
  }

  ngOnChanges(): void {
    if (this.ready) this.render();
  }

  ngOnDestroy(): void {
    this.root?.unmount();
  }

  private render(): void {
    if (!this.root) return;
    this.root.render(
      createElement(FluxToastStack, {
        items: this.items,
        colors: this.colors,
        className: 'fts-root flux-toast-root',
        minHeight: 0,
        stackGap: 14,
        expandedGap: 26,
        stackDepth: 22,
        onDismiss: (id: string) => this.dismiss.emit(id),
      })
    );
  }
}
