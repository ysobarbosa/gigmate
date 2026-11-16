import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DEMO_VIEWER, ViewerStore } from '@gigmate/musicians/data-access';
import { domHelpers, setupProfileFeature } from '../testing';
import { ProfileEditorPage } from './profile-editor-page';

async function render(onboarded: boolean) {
  await setupProfileFeature({ onboarded });
  const fixture = TestBed.createComponent(ProfileEditorPage);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement;
  return { fixture, el, ...domHelpers(el, () => fixture.detectChanges()) };
}

describe('ProfileEditorPage (onboarding)', () => {
  it('starts empty on step 1 and will not move on with missing answers', async () => {
    const { text, click, errors } = await render(false);
    expect(text('.eyebrow')).toBe('Criar perfil · Passo 1 de 6');
    expect(text('h2')).toBe('Sobre você');

    click('Próximo');
    expect(text('h2')).toBe('Sobre você');
    expect(errors()).toEqual([
      'Como você quer ser chamado?',
      'Informe sua idade.',
      'Escolha seu bairro.',
    ]);
  });

  it('walks through every step, previews the card and saves', async () => {
    const { fixture, text, click, type, choose, errors, el } =
      await render(false);

    type('Nome', 'Rafa');
    type('Idade', '29');
    choose('Bairro', 'Mooca');
    click('Próximo');
    expect(text('h2')).toBe('O que você toca');

    click('Próximo');
    expect(errors()).toEqual(['Escolha seu instrumento principal.']);
    choose('Instrumento principal', 'bass');
    choose('Segundo instrumento', 'bass');
    click('Próximo');
    expect(errors()).toEqual([
      'Escolha um instrumento diferente do principal.',
    ]);
    choose('Segundo instrumento', 'vocals');
    click('Bateria'); // looking for a drummer
    click('Próximo');
    expect(text('h2')).toBe('Sua música');

    el.querySelector<HTMLButtonElement>(
      'gm-chip-select[aria-label="Gêneros que você toca"] button',
    )!.click();
    click('Jam');
    click('Próximo');
    expect(text('h2')).toBe('Agenda e estrutura');

    click('Sex à noite');
    click('Próximo');
    expect(text('h2')).toBe('Contato e amostras');

    choose('Contato', 'whatsapp');
    expect(text('label[for="pf-contactValue"]')).toBe('WhatsApp');
    type('WhatsApp', '123');
    click('Próximo');
    expect(errors()).toEqual(['Use um celular com DDD, como (11) 98765-4321.']);
    type('WhatsApp', '(11) 98765-4321');
    type('Amostras', 'https://youtu.be/abc');
    click('Próximo');
    expect(text('h2')).toBe('Confira seu perfil');
    expect(text('gm-musician-card h2')).toBe('Rafa, 29');
    expect(text('gm-sample-links a')).toBe(
      'Ouvir no YouTube (abre em outra aba)',
    );
    expect(text('.body > p.hint:last-of-type')).toBe(
      'Só seus matches veem: WhatsApp 5511987654321.',
    );

    click('Começar a procurar');
    await fixture.whenStable();

    const saved = TestBed.inject(ViewerStore).viewer()!;
    expect(saved.name).toBe('Rafa');
    expect(saved.neighborhood).toBe('Mooca');
    expect(saved.instruments.map((s) => s.instrument)).toEqual([
      'bass',
      'vocals',
    ]);
    expect(saved.lookingFor).toEqual(['drums']);
    expect(saved.genresPlayed).toEqual(['rock']);
    expect(saved.goals).toEqual(['jam']);
    expect(saved.availability).toEqual(['fri-night']);
    expect(saved.contact).toEqual({ kind: 'whatsapp', value: '5511987654321' });
    expect(saved.samples).toEqual(['https://youtu.be/abc']);
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('goes back without losing answers', async () => {
    const { text, click, type, choose, el } = await render(false);
    type('Nome', 'Rafa');
    type('Idade', '29');
    choose('Bairro', 'Mooca');
    click('Próximo');
    click('Voltar');
    expect(text('h2')).toBe('Sobre você');
    expect(
      el.querySelector<HTMLInputElement>('input[type="text"]')!.value,
    ).toBe('Rafa');
  });
});

describe('ProfileEditorPage (accessibility)', () => {
  it('keeps labels short and links hints and errors to the fields', async () => {
    const { fixture, el, click } = await render(false);
    const neighborhood =
      el.querySelector<HTMLSelectElement>('#pf-neighborhood')!;

    // The label's own text is the name: no hint, no options, no errors in it.
    expect(neighborhood.labels?.[0].textContent?.trim()).toBe('Bairro');
    expect(neighborhood.getAttribute('aria-invalid')).toBeNull();
    expect(neighborhood.getAttribute('aria-describedby')).toBe(
      'pf-neighborhood-hint',
    );

    click('Próximo');
    await fixture.whenStable();

    expect(neighborhood.getAttribute('aria-invalid')).toBe('true');
    expect(neighborhood.getAttribute('aria-describedby')).toBe(
      'pf-neighborhood-hint pf-neighborhood-error',
    );
    expect(
      el.querySelector('#pf-neighborhood-error')?.textContent?.trim(),
    ).toBe('Escolha seu bairro.');
    // The cursor goes to the first field to fix.
    expect(document.activeElement).toBe(el.querySelector('#pf-name'));
  });

  it('gives the two level selects distinct names', async () => {
    const { fixture, el, type, choose, click } = await render(false);
    type('Nome', 'Rafa');
    type('Idade', '29');
    choose('Bairro', 'Mooca');
    click('Próximo');
    await fixture.whenStable();
    expect(
      Array.from(el.querySelectorAll('select[aria-label]')).map((s) =>
        s.getAttribute('aria-label'),
      ),
    ).toEqual([
      'Nível do instrumento principal',
      'Nível do segundo instrumento',
    ]);
    // The new step's title gets focus, so the step change is announced.
    expect(document.activeElement?.textContent?.trim()).toBe('O que você toca');
  });
});

describe('ProfileEditorPage (editing)', () => {
  it('starts from the saved profile and can be cancelled', async () => {
    const { text, el, has } = await render(true);
    expect(text('.eyebrow')).toBe('Editar perfil · Passo 1 de 6');
    expect(
      el.querySelector<HTMLInputElement>('input[type="text"]')!.value,
    ).toBe(DEMO_VIEWER.name);
    expect(has('Cancelar')).toBe(true);
  });

  it('saves changes over the existing profile', async () => {
    const { fixture, click, type } = await render(true);
    type('Nome', 'Você mesmo');
    for (let i = 0; i < 5; i++) click('Próximo');
    click('Salvar perfil');
    await fixture.whenStable();
    expect(TestBed.inject(ViewerStore).viewer()).toEqual({
      ...DEMO_VIEWER,
      name: 'Você mesmo',
    });
  });
});
