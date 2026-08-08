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
import { LineSidebar } from '../demo/ari/line-sidebar';

@Component({
  selector: 'line-sidebar',
  template: '<div class="line-sidebar-host" #host></div>',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../demo/ari/line-sidebar.css', './line-sidebar.css'],
})
export class LineSidebarComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;

  @Input() items: string[] = [];
  @Input() accentColor = '#a855f7';
  @Input() textColor = '#8b8ba0';
  @Input() markerColor = '#3d3d4e';
  @Input() showIndex = false;
  @Input() showMarker = true;
  @Input() proximityRadius = 120;
  @Input() maxShift = 10;
  @Input() falloff: 'linear' | 'smooth' | 'sharp' = 'smooth';
  @Input() markerLength = 34;
  @Input() itemGap = 6;
  @Input() fontSize = 0.98;
  @Input() smoothing = 120;
  @Input() defaultActive: number | null = null;
  @Output() itemClick = new EventEmitter<{ index: number; label: string }>();

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
      createElement(LineSidebar, {
        key: this.defaultActive ?? 'none',
        items: this.items,
        accentColor: this.accentColor,
        textColor: this.textColor,
        markerColor: this.markerColor,
        showIndex: this.showIndex,
        showMarker: this.showMarker,
        proximityRadius: this.proximityRadius,
        maxShift: this.maxShift,
        falloff: this.falloff,
        markerLength: this.markerLength,
        itemGap: this.itemGap,
        fontSize: this.fontSize,
        smoothing: this.smoothing,
        defaultActive: this.defaultActive,
        onItemClick: (index: number, label: string) => this.itemClick.emit({ index, label }),
      })
    );
  }
}
