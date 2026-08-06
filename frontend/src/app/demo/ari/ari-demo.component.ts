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

@Component({
  selector: 'app-ari-demo',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './ari-demo.html',
  styleUrls: ['./ari-demo.css', './flux-toast-stack.css'],
})
export class AriDemoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;

  private root?: Root;

  ngAfterViewInit(): void {
    this.mount();
  }

  ngOnDestroy(): void {
    this.root?.unmount();
    this.root = undefined;
  }

  reset(): void {
    this.mount();
  }

  private mount(): void {
    this.root?.unmount();
    this.root = createRoot(this.host.nativeElement);
    this.root.render(createElement(FluxToastStack, {}));
  }
}
