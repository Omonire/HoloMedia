import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FluxToastStack } from './flux-toast-stack';
import { ScrollExpand } from './scroll-expand';
import { LineSidebar } from './line-sidebar';

@Component({
  selector: 'app-ari-demo',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ari-demo.html',
  styleUrls: ['./ari-demo.css', './flux-toast-stack.css', './scroll-expand.css', './line-sidebar.css'],
})
export class AriDemoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('toastHost', { static: true }) toastHost!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollWinHost', { static: true }) scrollWinHost!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollBoxHost', { static: true }) scrollBoxHost!: ElementRef<HTMLDivElement>;
  @ViewChild('sidebarHost', { static: true }) sidebarHost!: ElementRef<HTMLDivElement>;

  private roots: Root[] = [];

  heroSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this.buildHeroSvg());

  ngAfterViewInit(): void {
    this.mountAll();
  }

  ngOnDestroy(): void {
    for (const root of this.roots) root.unmount();
    this.roots = [];
  }

  reset(): void {
    this.mountAll();
  }

  private mountAll(): void {
    for (const root of this.roots) root.unmount();
    this.roots = [];

    this.roots.push(
      createRoot(this.toastHost.nativeElement),
      createRoot(this.scrollWinHost.nativeElement),
      createRoot(this.scrollBoxHost.nativeElement),
      createRoot(this.sidebarHost.nativeElement)
    );

    this.roots[0].render(createElement(FluxToastStack, {}));

    this.roots[1].render(
      createElement(ScrollExpand, {
        src: this.heroSvg,
        alt: 'HoloMedia gradient hero',
        title: 'Built to scale',
        scrollHint: 'Scroll inside the frame',
        useWindowScroll: true,
      })
    );

    this.roots[2].render(
      createElement(
        ScrollExpand,
        {
          src: this.heroSvg,
          alt: 'HoloMedia gradient hero',
          title: 'Every pixel, everywhere',
          mediaZoom: 1.35,
          startWidth: 42,
          startHeight: 58,
          startRadius: 24,
          endRadius: 0,
          scrollDistance: 1.2,
          holdDistance: 0.35,
          smoothing: 0.1,
          overlayScrim: 0.45,
          enabled: true,
        },
        createElement(
          'div',
          { style: { textAlign: 'center', padding: '0 6%' } },
          createElement(
            'h2',
            null,
            'Every pixel, everywhere'
          ),
          createElement(
            'p',
            null,
            'The frame opens up as you scroll and hands the whole stage to your media.'
          )
        )
      )
    );

    this.roots[3].render(
      createElement(LineSidebar, {
        items: ['Overview', 'Components', 'Animations', 'Backgrounds', 'Showcase'],
        accentColor: '#a855f7',
        textColor: '#c4c4c4',
        markerColor: '#6c6c6c',
        showIndex: true,
        showMarker: true,
        proximityRadius: 100,
        maxShift: 30,
        falloff: 'smooth',
        markerLength: 60,
        itemGap: 20,
        fontSize: 1.1,
        smoothing: 100,
        defaultActive: 0,
        onItemClick: (index: number, label: string) => {
          console.log(index, label);
        },
      })
    );
  }

  private buildHeroSvg(): string {
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#ec4899"/>' +
      '</linearGradient><radialGradient id="r" cx="0.82" cy="0.15" r="0.9">' +
      '<stop offset="0" stop-color="#38bdf8" stop-opacity="0.5"/>' +
      '<stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<rect width="1200" height="900" fill="#0a0a10"/>' +
      '<rect width="1200" height="900" fill="url(#g)" opacity="0.9"/>' +
      '<rect width="1200" height="900" fill="url(#r)"/>' +
      '<circle cx="985" cy="175" r="150" fill="#7c3aed" opacity="0.55"/>' +
      '<circle cx="155" cy="770" r="185" fill="#ec4899" opacity="0.35"/>' +
      '</svg>'
    );
  }
}
