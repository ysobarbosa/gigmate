import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { AvailabilitySlot } from '@gigmate/musicians/domain';
import { AvailabilityGrid } from './availability-grid';

@Component({
  imports: [AvailabilityGrid],
  template: `<gm-availability-grid [(slots)]="slots" />`,
})
class Host {
  readonly slots = signal<readonly AvailabilitySlot[]>(['sat-afternoon']);
}

describe('AvailabilityGrid', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const cell = (label: string) =>
      el.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
    const click = (label: string) => {
      cell(label).click();
      fixture.detectChanges();
    };
    return { el, cell, click, host: fixture.componentInstance };
  }

  it('renders 21 labelled toggles reflecting the slots', () => {
    const { el, cell } = setup();
    expect(el.querySelectorAll('button')).toHaveLength(21);
    expect(cell('Sáb à tarde').getAttribute('aria-pressed')).toBe('true');
    expect(cell('Seg de manhã').getAttribute('aria-pressed')).toBe('false');
    expect(el.querySelector('gm-availability-grid')?.getAttribute('role')).toBe(
      'group',
    );
  });

  it('toggles slots two-way and keeps grid order', () => {
    const { click, host } = setup();
    click('Ter à noite');
    click('Seg de manhã');
    expect(host.slots()).toEqual(['mon-morning', 'tue-night', 'sat-afternoon']);
    click('Sáb à tarde');
    expect(host.slots()).toEqual(['mon-morning', 'tue-night']);
  });
});
