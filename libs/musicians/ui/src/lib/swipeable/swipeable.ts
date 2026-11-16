import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { type SwipeDirection, swipeOutcome } from './swipe-outcome';

/** How long the card takes to fly off before `swiped` fires. */
export const FLING_MS = 220;

/**
 * Makes an element draggable sideways with pointer events (mouse, touch, pen)
 * and emits `swiped` when the drag passes the threshold. `fling()` plays the
 * same exit from code, so buttons and keyboard get the same animation.
 *
 * All motion is a CSS transform bound to signals: no layout work per frame.
 */
@Directive({
  selector: '[gmSwipeable]',
  exportAs: 'gmSwipeable',
  host: {
    // Let the page scroll vertically; horizontal drags belong to the card.
    style: 'touch-action: pan-y; user-select: none;',
    '[style.transform]': 'transform()',
    '[style.transition]': 'transition()',
    '[class.gm-dragging]': 'dragging()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp()',
    '(pointercancel)': 'reset()',
  },
})
export class Swipeable {
  readonly swipeDisabled = input(false);
  readonly swiped = output<SwipeDirection>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly offsetX = signal(0);
  private startX: number | null = null;
  private flingTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly dragging = signal(false);
  private readonly leaving = signal(false);

  /** Direction the card is currently leaning, for "like"/"pass" stamps. */
  readonly leaning = computed<SwipeDirection | null>(() => {
    const x = this.offsetX();
    return x > 30 ? 'like' : x < -30 ? 'pass' : null;
  });

  protected readonly transform = computed(() => {
    const x = this.offsetX();
    return x === 0 ? null : `translateX(${x}px) rotate(${x / 18}deg)`;
  });

  protected readonly transition = computed(() =>
    this.dragging() ? 'none' : `transform ${FLING_MS}ms ease-out`,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.flingTimer));
  }

  protected onPointerDown(event: PointerEvent): void {
    if (this.swipeDisabled() || this.leaving() || event.button > 0) return;
    this.startX = event.clientX;
    this.dragging.set(true);
    // Keep receiving moves even when the pointer leaves the card.
    this.element.nativeElement.setPointerCapture?.(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.startX === null) return;
    this.offsetX.set(event.clientX - this.startX);
  }

  protected onPointerUp(): void {
    if (this.startX === null) return;
    this.startX = null;
    this.dragging.set(false);
    const width = this.element.nativeElement.offsetWidth;
    const outcome = swipeOutcome(this.offsetX(), width);
    if (outcome) this.fling(outcome);
    else this.offsetX.set(0);
  }

  /** Throws the card out in `direction`, then emits `swiped`. */
  fling(direction: SwipeDirection): void {
    if (this.leaving() || this.swipeDisabled()) return;
    this.leaving.set(true);
    const distance =
      Math.max(this.element.nativeElement.offsetWidth, 320) * 1.5;
    this.offsetX.set(direction === 'like' ? distance : -distance);
    const duration = prefersReducedMotion() ? 0 : FLING_MS;
    this.flingTimer = setTimeout(() => this.swiped.emit(direction), duration);
  }

  reset(): void {
    this.startX = null;
    this.dragging.set(false);
    this.offsetX.set(0);
  }
}

function prefersReducedMotion(): boolean {
  return (
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );
}
