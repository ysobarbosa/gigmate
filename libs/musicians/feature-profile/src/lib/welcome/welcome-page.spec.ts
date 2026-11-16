import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DEMO_VIEWER, ViewerStore } from '@gigmate/musicians/data-access';
import { domHelpers, setupProfileFeature } from '../testing';
import { WelcomePage } from './welcome-page';

describe('WelcomePage', () => {
  async function render() {
    await setupProfileFeature({ onboarded: false });
    const fixture = TestBed.createComponent(WelcomePage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    return { fixture, el, ...domHelpers(el, () => fixture.detectChanges()) };
  }

  it('offers to create a profile', async () => {
    const { el } = await render();
    const link = Array.from(el.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Criar meu perfil',
    );
    expect(link?.getAttribute('href')).toBe('/perfil');
  });

  it('can explore right away as the demo musician', async () => {
    const { fixture, click } = await render();
    click('Explorar com um perfil de exemplo');
    await fixture.whenStable();
    expect(TestBed.inject(ViewerStore).viewer()).toEqual(DEMO_VIEWER);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
