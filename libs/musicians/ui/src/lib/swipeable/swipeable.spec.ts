import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FLING_MS, Swipeable } from './swipeable';
import { swipeOutcome, type SwipeDirection } from './swipe-outcome';

describe('swipeOutcome', () => {
  it.each([
    [0, 400, null],
    [99, 400, null],
    [100, 400, 'like'],
    [-100, 400, 'pass'],
    // Narrow card: the 80 px minimum wins over 25% of the width.
    [60, 200, null],
    [80, 200, 'like'],
  ] as const)('dx=%p on a %p px card → %p', (dx, width, expected) => {
    expect(swipeOutcome(dx, width)).toBe(expected);
  });
});

@Component({
  imports: [Swipeable],
  template: `<div
    gmSwipeable
    [swipeDisabled]="disabled()"
    (swiped)="swipes.push($event)"
  ></div>`,
})
class Host {
  readonly swipeable = viewChild.required(Swipeable);
  readonly disabled = signal(false);
  readonly swipes: SwipeDirection[] = [];
}

describe('Swipeable', () => {
  let host: Host;
  let el: HTMLElement;

  // jsdom has no PointerEvent; a MouseEvent with the pointer type name works.
  const pointer = (type: string, clientX = 0) =>
    el.dispatchEvent(new MouseEvent(type, { clientX, bubbles: true }));

  beforeEach(() => {
    jest.useFakeTimers();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    host = fixture.componentInstance;
    el = fixture.nativeElement.querySelector('[gmSwipeable]');
  });

  afterEach(() => jest.useRealTimers());

  const drag = (from: number, to: number) => {
    pointer('pointerdown', from);
    pointer('pointermove', to);
    pointer('pointerup', to);
  };

  it('follows the pointer while dragging and leans toward the side', () => {
    pointer('pointerdown', 100);
    pointer('pointermove', 150);
    expect(host.swipeable().leaning()).toBe('like');
    pointer('pointermove', 50);
    expect(host.swipeable().leaning()).toBe('pass');
  });

  it('snaps back after a short drag and emits nothing', () => {
    drag(100, 150);
    jest.advanceTimersByTime(FLING_MS);
    expect(host.swipeable().leaning()).toBeNull();
    expect(host.swipes).toEqual([]);
  });

  it('emits like after a long drag right, once the card has flown off', () => {
    drag(100, 300);
    expect(host.swipes).toEqual([]);
    jest.advanceTimersByTime(FLING_MS);
    expect(host.swipes).toEqual(['like']);
  });

  it('emits pass after a long drag left', () => {
    drag(300, 100);
    jest.advanceTimersByTime(FLING_MS);
    expect(host.swipes).toEqual(['pass']);
  });

  it('fling() plays the same exit from code (buttons, keyboard)', () => {
    host.swipeable().fling('pass');
    host.swipeable().fling('like'); // ignored: already leaving
    jest.advanceTimersByTime(FLING_MS);
    expect(host.swipes).toEqual(['pass']);
  });

  it('ignores drags and flings while disabled', () => {
    host.disabled.set(true);
    TestBed.tick();
    drag(100, 300);
    host.swipeable().fling('like');
    jest.advanceTimersByTime(FLING_MS);
    expect(host.swipes).toEqual([]);
  });

  it('ignores moves without a pointerdown first', () => {
    pointer('pointermove', 300);
    expect(host.swipeable().leaning()).toBeNull();
  });
});
