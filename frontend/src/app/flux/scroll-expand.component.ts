import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ScrollExpand } from '../demo/ari/scroll-expand';

@Component({
  selector: 'scroll-expand',
  template: '<div class="scroll-expand-host" #host></div>',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../demo/ari/scroll-expand.css', './scroll-expand.css'],
})
export class ScrollExpandComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;

  @Input() src = '';
  @Input() mediaType: 'image' | 'video' = 'image';
  @Input() poster = '';
  @Input() alt = '';
  @Input() title = '';
  @Input() scrollHint = '';
  @Input() useWindowScroll = false;
  @Input() enabled = true;
  @Input() startWidth = 42;
  @Input() startHeight = 58;
  @Input() startRadius = 24;
  @Input() endRadius = 0;
  @Input() mediaZoom = 1.35;
  @Input() scrollDistance = 1.2;
  @Input() holdDistance = 0.35;
  @Input() smoothing = 0.1;
  @Input() overlayScrim = 0.45;

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
      createElement(ScrollExpand, {
        src: this.src,
        mediaType: this.mediaType,
        poster: this.poster,
        alt: this.alt,
        title: this.title,
        scrollHint: this.scrollHint,
        useWindowScroll: this.useWindowScroll,
        enabled: this.enabled,
        startWidth: this.startWidth,
        startHeight: this.startHeight,
        startRadius: this.startRadius,
        endRadius: this.endRadius,
        mediaZoom: this.mediaZoom,
        scrollDistance: this.scrollDistance,
        holdDistance: this.holdDistance,
        smoothing: this.smoothing,
        overlayScrim: this.overlayScrim,
      })
    );
  }
}
