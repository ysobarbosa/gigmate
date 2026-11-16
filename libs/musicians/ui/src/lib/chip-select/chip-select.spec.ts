import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Option } from '../labels';
import { ChipSelect } from './chip-select';

type Fruit = 'apple' | 'banana' | 'cherry';

@Component({
  imports: [ChipSelect],
  template: `<gm-chip-select
    label="Frutas"
    [options]="options"
    [(selected)]="selected"
  />`,
})
class Host {
  readonly options: readonly Option<Fruit>[] = [
    { value: 'apple', label: 'Maçã' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cereja' },
  ];
  readonly selected = signal<readonly Fruit[]>(['banana']);
}

describe('ChipSelect', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const chips = (): HTMLButtonElement[] =>
      Array.from(fixture.nativeElement.querySelectorAll('button'));
    const click = (label: string) => {
      chips()
        .find((b) => b.textContent?.trim() === label)!
        .click();
      fixture.detectChanges();
    };
    return { fixture, chips, click, host: fixture.componentInstance };
  }

  it('is a labelled group of toggle buttons reflecting the selection', () => {
    const { fixture, chips } = setup();
    const group = fixture.nativeElement.querySelector('gm-chip-select');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Frutas');
    expect(chips().map((b) => b.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });

  it('toggles values two-way, keeping the options order', () => {
    const { click, host } = setup();
    click('Cereja');
    click('Maçã');
    expect(host.selected()).toEqual(['apple', 'banana', 'cherry']);
    click('Banana');
    expect(host.selected()).toEqual(['apple', 'cherry']);
  });
});
